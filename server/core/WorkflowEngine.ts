import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';
import { WorkflowContext, WorkflowDefinition, WorkflowNodeInstance, WorkflowEdge, WorkflowStatus } from '../types/workflow.types';
import { NodeRegistry } from './NodeRegistry';
import { AuditLogger } from './AuditLogger';
import { executeNode, NodeToExecute } from '../nodes/nodeExecutor';

interface WorkflowRunRow {
  id: string;
  workflow_id: string;
  status: WorkflowStatus;
  context: string | null;
  started_at: string;
  completed_at: string | null;
  triggered_by: string | null;
  error_message: string | null;
}

export interface WorkflowExecutionResult {
  success: boolean;
  status: WorkflowStatus;
  waitingForApproval?: boolean;
  context: WorkflowContext;
  error?: string;
}

export class WorkflowEngine {
  private nodeRegistry: NodeRegistry;
  private auditLogger: AuditLogger;

  constructor() {
    this.nodeRegistry = new NodeRegistry();
    this.auditLogger = new AuditLogger();
  }

  createRun(workflowId: string, triggeredBy: string = 'manual'): string {
    const id = uuid();
    const db = getDB();
    db.prepare(
      `INSERT INTO workflow_runs (id, workflow_id, status, context, started_at, triggered_by)
       VALUES (?, ?, 'PENDING', ?, ?, ?)`
    ).run(id, workflowId, JSON.stringify({}), new Date().toISOString(), triggeredBy);
    return id;
  }

  private isDryRun(runId: string): boolean {
    return runId.startsWith('dry-run-');
  }

  private mergeContext(base: WorkflowContext, patch?: Partial<WorkflowContext>): WorkflowContext {
    if (!patch) {
      return base;
    }

    return {
      ...base,
      ...patch,
      document: { ...base.document, ...(patch.document || {}) },
      invoice: { ...base.invoice, ...(patch.invoice || {}) },
      employee: { ...base.employee, ...(patch.employee || {}) },
      procurement: { ...base.procurement, ...(patch.procurement || {}) },
      finance: { ...base.finance, ...(patch.finance || {}) },
      task: { ...base.task, ...(patch.task || {}) },
      metadata: { ...base.metadata, ...(patch.metadata || {}) },
      workflowState: {
        ...base.workflowState,
        ...(patch.workflowState || {}),
        retries: {
          ...base.workflowState.retries,
          ...(patch.workflowState?.retries || {}),
        },
        pendingNodeIds: patch.workflowState?.pendingNodeIds || base.workflowState.pendingNodeIds || [],
        executedNodeIds: patch.workflowState?.executedNodeIds || base.workflowState.executedNodeIds || [],
      },
      logs: Array.isArray(patch.logs) && patch.logs.length > 0 ? patch.logs : base.logs,
    };
  }

  private safeParseContext(raw: string | null | undefined, workflowId: string, runId: string): WorkflowContext {
    if (!raw) {
      return this.buildInitialContext(workflowId, runId);
    }

    try {
      const parsed = JSON.parse(raw) as Partial<WorkflowContext>;
      return this.mergeContext(this.buildInitialContext(workflowId, runId), parsed);
    } catch {
      return this.buildInitialContext(workflowId, runId);
    }
  }

  private buildContextSnapshot(context: WorkflowContext): string {
    return JSON.stringify({
      workflowId: context.workflowId,
      runId: context.runId,
      document: context.document,
      invoice: context.invoice,
      employee: context.employee,
      procurement: context.procurement,
      finance: context.finance,
      task: context.task,
      metadata: context.metadata,
      workflowState: context.workflowState,
      logs: context.logs.slice(-25),
    });
  }

  private appendContextLog(
    context: WorkflowContext,
    nodeId: string,
    nodeName: string,
    status: 'running' | 'completed' | 'failed' | 'waiting' | 'skipped',
    message: string,
    durationMs?: number
  ): WorkflowContext {
    return {
      ...context,
      logs: [
        ...(context.logs || []),
        {
          timestamp: new Date().toISOString(),
          nodeId,
          nodeName,
          status,
          message,
          durationMs,
        },
      ],
    };
  }

  private persistRunState(
    runId: string,
    status: WorkflowStatus,
    context: WorkflowContext,
    options?: { completedAt?: string | null; errorMessage?: string | null }
  ): void {
    if (this.isDryRun(runId)) {
      return;
    }

    const db = getDB();
    db.prepare(
      `UPDATE workflow_runs
       SET status = ?, context = ?, completed_at = ?, error_message = ?
       WHERE id = ?`
    ).run(
      status,
      JSON.stringify(context),
      options?.completedAt ?? null,
      options?.errorMessage ?? null,
      runId
    );
  }

  private recordWorkflowLog(
    runId: string,
    node: WorkflowNodeInstance,
    status: 'running' | 'completed' | 'failed' | 'waiting' | 'skipped',
    inputSnapshot: string,
    outputSnapshot: string,
    error: string | null,
    durationMs: number
  ): void {
    if (this.isDryRun(runId)) {
      return;
    }

    const db = getDB();
    db.prepare(
      `INSERT INTO workflow_logs (
        id, run_id, node_id, node_type, status, input_snapshot, output_snapshot, error, duration_ms, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      uuid(),
      runId,
      node.instanceId,
      node.nodeType,
      status,
      inputSnapshot,
      outputSnapshot,
      error,
      durationMs,
      new Date().toISOString()
    );
  }

  private buildExecutionGraph(workflow: WorkflowDefinition) {
    const nodes: WorkflowNodeInstance[] = workflow.nodes || [];
    const edges: WorkflowEdge[] = workflow.edges || [];
    const TRIGGER_TYPES = new Set([
      'manual_trigger',
      'webhook_trigger',
      'file_upload_trigger',
      'timer_trigger',
      'meeting_transcript_trigger',
      'manual trigger',
      'webhook',
      'file upload',
      'schedule',
      'api trigger',
      'manualtriggernode',
      'webhooktriggernode',
      'fileuploadtriggernode',
      'timertriggernode',
      'meetingtranscripttriggernode',
    ]);

    const startNode = nodes.find((node) => {
      const type = node.nodeType.toLowerCase();
      return TRIGGER_TYPES.has(type) || type.includes('trigger');
    });

    if (!startNode) {
      throw new Error('NoStartNode: Workflow must have a trigger node');
    }

    const nodeMap = new Map<string, WorkflowNodeInstance>(nodes.map((node) => [node.instanceId, node]));
    const adjacency = new Map<string, string[]>();
    nodes.forEach((node) => adjacency.set(node.instanceId, []));
    edges.forEach((edge) => {
      const targets = adjacency.get(edge.fromNodeId) || [];
      targets.push(edge.toNodeId);
      adjacency.set(edge.fromNodeId, targets);
    });

    return { nodes, edges, startNode, nodeMap, adjacency };
  }

  private dedupePendingNodeIds(queue: string[], executedNodes: Set<string>): string[] {
    const seen = new Set<string>();
    const pending: string[] = [];
    for (const nodeId of queue) {
      if (!nodeId || executedNodes.has(nodeId) || seen.has(nodeId)) {
        continue;
      }
      seen.add(nodeId);
      pending.push(nodeId);
    }
    return pending;
  }

  private async executeDefinition(
    workflow: WorkflowDefinition,
    runId: string,
    baseContext: WorkflowContext
  ): Promise<WorkflowExecutionResult> {
    const { startNode, nodeMap, adjacency } = this.buildExecutionGraph(workflow);
    const isDryRun = this.isDryRun(runId);

    let context = this.mergeContext(baseContext, {
      metadata: {
        ...baseContext.metadata,
        workflowName: workflow.name,
      },
      workflowState: {
        ...baseContext.workflowState,
        status: 'RUNNING',
      },
    });

    let executedNodes = new Set<string>(context.workflowState.executedNodeIds || []);
    let queue = this.dedupePendingNodeIds(
      context.workflowState.pendingNodeIds && context.workflowState.pendingNodeIds.length > 0
        ? context.workflowState.pendingNodeIds
        : [startNode.instanceId],
      executedNodes
    );

    context.workflowState = {
      ...context.workflowState,
      status: 'RUNNING',
      pendingNodeIds: queue,
      executedNodeIds: [...executedNodes],
    };
    this.persistRunState(runId, 'RUNNING', context, { errorMessage: null });

    const maxIterations = 1000;
    let iterations = 0;

    while (queue.length > 0 && iterations < maxIterations) {
      iterations += 1;
      const nodeId = queue.shift();
      if (!nodeId || executedNodes.has(nodeId)) {
        queue = this.dedupePendingNodeIds(queue, executedNodes);
        continue;
      }

      const node = nodeMap.get(nodeId);
      if (!node) {
        queue = this.dedupePendingNodeIds(queue, executedNodes);
        continue;
      }

      const inputSnapshot = this.buildContextSnapshot(context);
      const startedAt = Date.now();

      context.workflowState = {
        ...context.workflowState,
        currentNodeId: nodeId,
        status: 'RUNNING',
        pendingNodeIds: this.dedupePendingNodeIds(queue, executedNodes),
        executedNodeIds: [...executedNodes],
      };

      try {
        const nodeToExecute: NodeToExecute = {
          instanceId: node.instanceId,
          nodeType: node.nodeType,
          config: {
            ...node.config,
            nodeName: node.name,
          },
        };

        context = await executeNode(nodeToExecute, context);
        const durationMs = Date.now() - startedAt;
        executedNodes.add(nodeId);

        const nextNodes = adjacency.get(nodeId) || [];
        const nextQueue = this.dedupePendingNodeIds([...queue, ...nextNodes], executedNodes);
        const isWaitingForApproval =
          context.workflowState.status === 'WAITING_APPROVAL' ||
          String(context.metadata.approvalStatus || '').toUpperCase() === 'PENDING';

        if (isWaitingForApproval) {
          context = this.appendContextLog(
            context,
            nodeId,
            node.name,
            'waiting',
            `Waiting for approval after ${node.name}`,
            durationMs
          );
          context.workflowState = {
            ...context.workflowState,
            currentNodeId: nodeId,
            status: 'WAITING_APPROVAL',
            pendingNodeIds: nextQueue,
            executedNodeIds: [...executedNodes],
          };
          this.recordWorkflowLog(runId, node, 'waiting', inputSnapshot, this.buildContextSnapshot(context), null, durationMs);
          this.persistRunState(runId, 'WAITING_APPROVAL', context, { errorMessage: null });

          if (!isDryRun) {
            this.auditLogger.log({
              agentId: 'workflow_engine',
              eventType: 'WORKFLOW_WAITING_APPROVAL',
              event: `Workflow ${workflow.workflowId} is waiting for approval at ${node.name}`,
              metadata: { workflowId: workflow.workflowId, runId, nodeId, nodeName: node.name },
            });
          }

          return {
            success: true,
            status: 'WAITING_APPROVAL',
            waitingForApproval: true,
            context,
          };
        }

        queue = nextQueue;
        context = this.appendContextLog(context, nodeId, node.name, 'completed', `Executed ${node.name}`, durationMs);
        context.workflowState = {
          ...context.workflowState,
          currentNodeId: nodeId,
          status: 'RUNNING',
          pendingNodeIds: queue,
          executedNodeIds: [...executedNodes],
          lastError: undefined,
        };
        this.recordWorkflowLog(runId, node, 'completed', inputSnapshot, this.buildContextSnapshot(context), null, durationMs);
        this.persistRunState(runId, 'RUNNING', context, { errorMessage: null });
      } catch (nodeError) {
        const errorMessage = nodeError instanceof Error ? nodeError.message : 'UnknownError';
        const durationMs = Date.now() - startedAt;
        const retries = { ...(context.workflowState.retries || {}) };
        const previousRetries = retries[nodeId] || 0;
        const maxRetriesForNode = node.retryConfig?.maxRetries ?? 3;
        retries[nodeId] = previousRetries + 1;

        context = this.appendContextLog(
          context,
          nodeId,
          node.name,
          'failed',
          `${node.name} failed: ${errorMessage}`,
          durationMs
        );
        context.workflowState = {
          ...context.workflowState,
          currentNodeId: nodeId,
          retries,
          status: 'RUNNING',
          pendingNodeIds: this.dedupePendingNodeIds(queue, executedNodes),
          executedNodeIds: [...executedNodes],
          lastError: errorMessage,
        };
        this.recordWorkflowLog(runId, node, 'failed', inputSnapshot, this.buildContextSnapshot(context), errorMessage, durationMs);

        if (previousRetries < maxRetriesForNode) {
          const retryEvents = Array.isArray(context.metadata.retryEvents) ? (context.metadata.retryEvents as unknown[]) : [];
          context.metadata = {
            ...context.metadata,
            retryEvents: [
              ...retryEvents,
              {
                nodeId,
                nodeName: node.name,
                attempt: retries[nodeId],
                error: errorMessage,
                timestamp: new Date().toISOString(),
              },
            ],
          };
          queue = this.dedupePendingNodeIds([...queue, nodeId], executedNodes);
          context.workflowState.pendingNodeIds = queue;
          this.persistRunState(runId, 'RUNNING', context, { errorMessage: null });

          if (!isDryRun) {
            this.auditLogger.log({
              agentId: 'workflow_engine',
              eventType: 'WORKFLOW_NODE_RETRY',
              event: `Retrying ${node.name} after failure`,
              metadata: { workflowId: workflow.workflowId, runId, nodeId, nodeName: node.name, attempt: retries[nodeId], error: errorMessage },
            });
          }
          continue;
        }

        if (node.retryConfig?.failurePolicy === 'escalate') {
          const escalations = Array.isArray(context.metadata.escalations) ? (context.metadata.escalations as unknown[]) : [];
          context.metadata = {
            ...context.metadata,
            escalations: [
              ...escalations,
              {
                nodeId,
                nodeName: node.name,
                error: errorMessage,
                escalatedAt: new Date().toISOString(),
              },
            ],
          };
        }

        throw new Error(`NodeExecutionFailed: ${nodeId} - ${errorMessage}`);
      }
    }

    if (iterations >= maxIterations) {
      throw new Error('WorkflowTimeout: Exceeded maximum execution iterations');
    }

    const completedAt = new Date().toISOString();
    context.workflowState = {
      ...context.workflowState,
      status: 'COMPLETED',
      completedAt,
      pendingNodeIds: [],
      executedNodeIds: [...executedNodes],
    };
    this.persistRunState(runId, 'COMPLETED', context, { completedAt, errorMessage: null });

    if (!isDryRun) {
      this.auditLogger.log({
        agentId: 'workflow_engine',
        eventType: 'WORKFLOW_COMPLETED',
        event: `Workflow ${workflow.workflowId} completed successfully in ${iterations} node iterations`,
        metadata: { workflowId: workflow.workflowId, runId, nodeCount: executedNodes.size },
      });
    }

    return { success: true, status: 'COMPLETED', context };
  }

  getWorkflow(workflowId: string): WorkflowDefinition | null {
    const db = getDB();
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as
      | (Record<string, unknown> & { id: string; name: string; description: string; nodes: string; edges: string; status: 'draft' | 'active' | 'disabled'; category: string })
      | undefined;

    if (!row) return null;

    return {
      workflowId: row.id,
      name: row.name,
      description: row.description,
      nodes: JSON.parse(row.nodes),
      edges: JSON.parse(row.edges),
      status: row.status,
      category: row.category,
    };
  }

  buildInitialContext(workflowId: string, runId: string): WorkflowContext {
    return {
      workflowId,
      runId,
      document: {},
      invoice: {},
      employee: {},
      procurement: {},
      finance: {},
      task: {},
      metadata: {},
      workflowState: {
        retries: {},
        startedAt: new Date().toISOString(),
        status: 'PENDING',
        pendingNodeIds: [],
        executedNodeIds: [],
      },
      logs: [],
    };
  }

  async execute(
    workflowId: string,
    runId: string,
    initialContext?: Partial<WorkflowContext>
  ): Promise<WorkflowExecutionResult> {
    const workflow = this.getWorkflow(workflowId);

    if (!workflow) {
      return { success: false, status: 'FAILED', context: {} as WorkflowContext, error: 'WorkflowNotFound' };
    }

    const existingRun = this.isDryRun(runId) ? null : (this.getRun(runId) as WorkflowRunRow | null);
    let context = existingRun
      ? this.safeParseContext(existingRun.context, workflowId, runId)
      : this.buildInitialContext(workflowId, runId);
    context = this.mergeContext(context, initialContext);

    try {
      return await this.executeDefinition(workflow, runId, context);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'UnknownError';
      const completedAt = new Date().toISOString();
      context.workflowState = {
        ...context.workflowState,
        status: 'FAILED',
        completedAt,
        lastError: errorMsg,
      };
      this.persistRunState(runId, 'FAILED', context, { completedAt, errorMessage: errorMsg });

      if (!this.isDryRun(runId)) {
        this.auditLogger.log({
          agentId: 'workflow_engine',
          eventType: 'WORKFLOW_FAILED',
          event: `Workflow ${workflowId} failed: ${errorMsg}`,
          metadata: { workflowId, runId, error: errorMsg },
        });
      }

      return { success: false, status: 'FAILED', context, error: errorMsg };
    }
  }

  async resolveApproval(
    runId: string,
    resolution: { approved: boolean; actor: string; comment?: string; data?: Record<string, unknown> }
  ): Promise<WorkflowExecutionResult> {
    const run = this.getRun(runId) as WorkflowRunRow | null;
    if (!run) {
      return { success: false, status: 'FAILED', context: {} as WorkflowContext, error: 'WorkflowRunNotFound' };
    }

    const workflowId = String(run.workflow_id);
    const context = this.safeParseContext(run.context, workflowId, runId);
    const resolvedAt = new Date().toISOString();
    const approvalResolution = {
      approved: resolution.approved,
      actor: resolution.actor,
      comment: resolution.comment || null,
      data: resolution.data || null,
      resolvedAt,
    };

    const decisions = Array.isArray(context.metadata.decisions) ? (context.metadata.decisions as unknown[]) : [];
    context.metadata = {
      ...context.metadata,
      approvalStatus: resolution.approved ? 'APPROVED' : 'REJECTED',
      approvalDecision: approvalResolution,
      decisions: [...decisions, approvalResolution],
    };

    if (!resolution.approved) {
      const errorMessage = `Approval rejected by ${resolution.actor}${resolution.comment ? `: ${resolution.comment}` : ''}`;
      const completedAt = new Date().toISOString();
      const rejectedContext = this.appendContextLog(
        context,
        context.workflowState.currentNodeId || 'approval',
        'Approval',
        'failed',
        errorMessage
      );

      rejectedContext.workflowState = {
        ...rejectedContext.workflowState,
        status: 'FAILED',
        completedAt,
        lastError: errorMessage,
      };
      this.persistRunState(runId, 'FAILED', rejectedContext, { completedAt, errorMessage });
      this.auditLogger.log({
        agentId: 'workflow_engine',
        eventType: 'WORKFLOW_APPROVAL_REJECTED',
        event: `Workflow ${workflowId} was rejected during approval`,
        decision: 'REJECTED',
        metadata: { workflowId, runId, actor: resolution.actor, comment: resolution.comment || null },
      });

      return { success: false, status: 'FAILED', context: rejectedContext, error: errorMessage };
    }

    const resumedContext = this.appendContextLog(
      context,
      context.workflowState.currentNodeId || 'approval',
      'Approval',
      'completed',
      `Approval granted by ${resolution.actor}`
    );

    resumedContext.workflowState = {
      ...resumedContext.workflowState,
      status: 'RUNNING',
      completedAt: undefined,
      lastError: undefined,
      pendingNodeIds: context.workflowState.pendingNodeIds || [],
      executedNodeIds: context.workflowState.executedNodeIds || [],
    };
    this.persistRunState(runId, 'RUNNING', resumedContext, { errorMessage: null, completedAt: null });
    this.auditLogger.log({
      agentId: 'workflow_engine',
      eventType: 'WORKFLOW_RESUMED',
      event: `Workflow ${workflowId} resumed after approval`,
      decision: 'APPROVED',
      metadata: { workflowId, runId, actor: resolution.actor, comment: resolution.comment || null },
    });

    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return { success: false, status: 'FAILED', context: resumedContext, error: 'WorkflowNotFound' };
    }

    return this.executeDefinition(workflow, runId, resumedContext);
  }

  updateWorkflow(
    workflowId: string,
    updates: { name?: string; description?: string; nodes?: WorkflowNodeInstance[]; edges?: WorkflowEdge[]; status?: 'draft' | 'active' | 'disabled' }
  ): boolean {
    const db = getDB();
    const workflow = this.getWorkflow(workflowId);

    if (!workflow) return false;

    const updated = {
      name: updates.name ?? workflow.name,
      description: updates.description ?? workflow.description,
      nodes: updates.nodes ?? workflow.nodes,
      edges: updates.edges ?? workflow.edges,
      status: updates.status ?? workflow.status,
    };

    db.prepare(
      `UPDATE workflows SET name = ?, description = ?, nodes = ?, edges = ?, status = ?, updated_at = ? WHERE id = ?`
    ).run(
      updated.name,
      updated.description,
      JSON.stringify(updated.nodes),
      JSON.stringify(updated.edges),
      updated.status,
      new Date().toISOString(),
      workflowId
    );

    return true;
  }

  deleteWorkflow(workflowId: string): boolean {
    const db = getDB();
    const exists = db.prepare('SELECT id FROM workflows WHERE id = ?').get(workflowId);
    if (!exists) return false;

    db.prepare('DELETE FROM workflow_runs WHERE workflow_id = ?').run(workflowId);
    db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId);
    return true;
  }

  getRun(runId: string): Record<string, unknown> | null {
    const db = getDB();
    return db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(runId) as Record<string, unknown> | null;
  }
}
