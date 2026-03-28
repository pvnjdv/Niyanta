import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';
import { WorkflowContext, WorkflowDefinition, WorkflowNodeInstance, WorkflowEdge } from '../types/workflow.types';
import { NodeRegistry } from './NodeRegistry';
import { AuditLogger } from './AuditLogger';
import { executeNode, NodeToExecute } from '../nodes/nodeExecutor';

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
      },
      logs: [],
    };
  }

  async execute(
    workflowId: string,
    runId: string,
    initialContext?: Partial<WorkflowContext>
  ): Promise<{ success: boolean; context: WorkflowContext; error?: string }> {
    const db = getDB();
    const workflow = this.getWorkflow(workflowId);

    if (!workflow) {
      return { success: false, context: {} as WorkflowContext, error: 'WorkflowNotFound' };
    }

    // Update run status to RUNNING
    db.prepare('UPDATE workflow_runs SET status = ? WHERE id = ?').run('RUNNING', runId);

    let context = this.buildInitialContext(workflowId, runId);
    if (initialContext) {
      context = { ...context, ...initialContext };
    }

    try {
      const nodes: WorkflowNodeInstance[] = workflow.nodes || [];
      const edges: WorkflowEdge[] = workflow.edges || [];

      // Find start node (first trigger node) — matches canonical types, frontend display names, and class names
      const TRIGGER_TYPES = new Set(['manual_trigger', 'webhook_trigger', 'file_upload_trigger', 'timer_trigger', 'meeting_transcript_trigger', 'manual trigger', 'webhook', 'file upload', 'schedule', 'api trigger', 'manualtriggernode', 'webhooktriggernode', 'fileuploadtriggernode', 'timertriggernode', 'meetingtranscripttriggernode']);
      const startNode = nodes.find((n) => { const t = n.nodeType.toLowerCase(); return TRIGGER_TYPES.has(t) || t.includes('trigger'); });
      if (!startNode) {
        throw new Error('NoStartNode: Workflow must have a trigger node');
      }

      // Build adjacency list for execution
      const nodeMap = new Map<string, WorkflowNodeInstance>(nodes.map((n) => [n.instanceId, n]));
      const adjacency = new Map<string, string[]>();
      nodes.forEach((n) => adjacency.set(n.instanceId, []));
      edges.forEach((e) => {
        const targets = adjacency.get(e.fromNodeId) || [];
        targets.push(e.toNodeId);
        adjacency.set(e.fromNodeId, targets);
      });

      // Execute workflow from start node using BFS
      const executedNodes = new Set<string>();
      const queue: string[] = [startNode.instanceId];
      const maxIterations = 1000;
      let iterations = 0;

      while (queue.length > 0 && iterations < maxIterations) {
        iterations++;
        const nodeId = queue.shift();
        if (!nodeId || executedNodes.has(nodeId)) continue;

        const node = nodeMap.get(nodeId);
        if (!node) continue;

        // Execute the node
        try {
          const nodeToExecute: NodeToExecute = {
            instanceId: node.instanceId,
            nodeType: node.nodeType,
            config: node.config,
          };

          context = await executeNode(nodeToExecute, context);
          executedNodes.add(nodeId);

          // Add to logs
          context.logs = context.logs || [];
          context.logs.push({
            timestamp: new Date().toISOString(),
            nodeId,
            nodeName: node.name,
            status: 'completed',
            message: `Executed ${node.name}`,
          });

          // Queue next nodes
          const nextNodes = adjacency.get(nodeId) || [];
          nextNodes.forEach((next) => {
            if (!executedNodes.has(next)) queue.push(next);
          });
        } catch (nodeError) {
          const error = nodeError instanceof Error ? nodeError.message : 'UnknownError';

          context.logs = context.logs || [];
          context.logs.push({
            timestamp: new Date().toISOString(),
            nodeId,
            nodeName: node.name,
            status: 'failed',
            message: error,
          });

          // Retry logic
          const retries = context.workflowState?.retries || {};
          const nodeRetries = (retries[nodeId] as number) || 0;

          if (nodeRetries < 3) {
            retries[nodeId] = nodeRetries + 1;
            context.workflowState = { ...context.workflowState, retries };
            queue.push(nodeId); // Retry
          } else {
            throw new Error(`NodeExecutionFailed: ${nodeId} - ${error}`);
          }
        }
      }

      if (iterations >= maxIterations) {
        throw new Error('WorkflowTimeout: Exceeded maximum execution iterations');
      }

      // Mark run as COMPLETED
      context.workflowState = { ...context.workflowState, status: 'COMPLETED' };
      db.prepare('UPDATE workflow_runs SET status = ?, context = ?, completed_at = ? WHERE id = ?').run(
        'COMPLETED',
        JSON.stringify(context),
        new Date().toISOString(),
        runId
      );

      this.auditLogger.log({
        agentId: 'workflow_engine',
        eventType: 'WORKFLOW_COMPLETED',
        event: `Workflow ${workflowId} completed successfully in ${iterations} node iterations`,
        metadata: { workflowId, runId, nodeCount: executedNodes.size },
      });

      return { success: true, context };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'UnknownError';

      // Mark run as FAILED
      context.workflowState = { ...context.workflowState, status: 'FAILED' };
      db.prepare('UPDATE workflow_runs SET status = ?, context = ?, completed_at = ? WHERE id = ?').run(
        'FAILED',
        JSON.stringify(context),
        new Date().toISOString(),
        runId
      );

      this.auditLogger.log({
        agentId: 'workflow_engine',
        eventType: 'WORKFLOW_FAILED',
        event: `Workflow ${workflowId} failed: ${errorMsg}`,
        metadata: { workflowId, runId, error: errorMsg },
      });

      return { success: false, context, error: errorMsg };
    }
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
