import { v4 as uuid } from 'uuid';
import { callGroqJSON, callGroq, MODELS } from '../utils/groqClient';
import { AgentMessage } from '../types/agent.types';
import { WorkflowContext } from '../types/workflow.types';
import { AuditLogger } from './AuditLogger';
import { AgentManager } from './AgentManager';
import { MetricsResponse } from '../types/api.types';
import { getDB } from '../db/database';

export class NiyantaOrchestrator {
  private auditLogger: AuditLogger;
  private agentManager: AgentManager;
  private activeWorkflows: Map<string, WorkflowContext>;
  private messageQueue: AgentMessage[];
  private serverStartTime: number;
  private metrics: MetricsResponse;

  constructor() {
    this.auditLogger = new AuditLogger();
    this.agentManager = new AgentManager();
    this.activeWorkflows = new Map();
    this.messageQueue = [];
    this.serverStartTime = Date.now();
    this.metrics = {
      totalWorkflowsRun: 0,
      totalTasksCreated: 0,
      totalDecisionsMade: 0,
      escalationsTriggered: 0,
      avgProcessingTimeMs: 0,
      agentsActive: 10,
      uptimeSeconds: 0,
      agentRunCounts: {},
      decisionBreakdown: {
        autoApprove: 0,
        flag: 0,
        reject: 0,
        proceed: 0,
        hold: 0,
        escalate: 0,
        other: 0,
      },
      workflowStatusBreakdown: {
        PENDING: 0,
        RUNNING: 0,
        WAITING_APPROVAL: 0,
        FAILED: 0,
        COMPLETED: 0,
      },
    };
  }

  async routeToAgent(
    agentId: string,
    input: string,
    workflowContext?: Partial<WorkflowContext>
  ): Promise<{ result: Record<string, unknown>; processingTime: number; model: string }> {
    const started = Date.now();
    const agent = this.agentManager.getAgent(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const result = await callGroqJSON<Record<string, unknown>>(
      agent.systemPrompt,
      JSON.stringify({ input, workflowContext: workflowContext || {} }, null, 2),
      MODELS.DEFAULT
    );

    const processingTime = Date.now() - started;
    this.updateMetrics(agentId, result, processingTime);
    this.auditLogger.log({
      agentId,
      eventType: 'AGENT_RUN',
      event: `Executed ${agent.name}`,
      decision: typeof result.decision === 'string' ? result.decision : undefined,
      inputPreview: input.slice(0, 300),
      processingTime,
      metadata: { model: MODELS.DEFAULT },
    });

    return { result, processingTime, model: MODELS.DEFAULT };
  }

  async processOrchestratorChat(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    agentResults: Record<string, unknown>
  ): Promise<string> {
    const contextSummary = Object.entries(agentResults)
      .map(([agentId, result]) => `${agentId}: ${JSON.stringify(result).slice(0, 900)}`)
      .join('\n\n');

    const systemPrompt = `You are NIYANTA, the Autonomous Enterprise Governor — the central AI orchestrator
of an enterprise workflow platform. You coordinate 10 specialized agents across all departments.

You have complete situational awareness of all running agents and their results.
You are decisive, authoritative, and concise. You proactively identify cross-workflow risks.
You surface dependencies between workflows (e.g., a meeting approval that triggers procurement).
You escalate critical issues immediately.
You always provide WHY-CHAIN reasoning for your recommendations.

Current agent results:
${contextSummary || 'No agents have run yet.'}

Respond with authority. Be concise. Flag risks. Surface connections between workflows.`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message },
    ];

    return await callGroq(messages, MODELS.DEFAULT, 1000);
  }

  async detectCrossWorkflowInsights(agentResults: Record<string, unknown>): Promise<string[]> {
    const completedAgents = Object.entries(agentResults)
      .filter(([, result]) => result && typeof result === 'object')
      .map(([agentId, result]) => `${agentId}: ${JSON.stringify(result).slice(0, 800)}`);

    if (completedAgents.length === 0) return [];

    const prompt = `You are an enterprise workflow analyst.
Agent results summary:
${completedAgents.join('\n\n')}

Identify up to 5 specific cross-workflow connections, dependencies, or risks.
Respond ONLY with a JSON array of strings: ["insight1", "insight2"]
Each insight must be specific and actionable.`;

    try {
      const insights = await callGroqJSON<string[]>(
        'Return strict JSON array only. No markdown.',
        prompt,
        MODELS.REASONING
      );
      return Array.isArray(insights) ? insights : [];
    } catch {
      return [];
    }
  }

  private updateMetrics(agentId: string, result: Record<string, unknown>, processingTime: number): void {
    this.metrics.totalWorkflowsRun += 1;
    this.metrics.agentRunCounts[agentId] = (this.metrics.agentRunCounts[agentId] || 0) + 1;

    const totalRuns = Object.values(this.metrics.agentRunCounts).reduce((a, b) => a + b, 0);
    const previousTotal = this.metrics.avgProcessingTimeMs * Math.max(totalRuns - 1, 0);
    this.metrics.avgProcessingTimeMs = Math.round((previousTotal + processingTime) / totalRuns);

    if (Array.isArray(result.tasks)) {
      this.metrics.totalTasksCreated += result.tasks.length;
    }

    if (typeof result.decision === 'string') {
      this.metrics.totalDecisionsMade += 1;
      const decision = result.decision.toUpperCase();
      if (decision.includes('AUTO-APPROVE')) this.metrics.decisionBreakdown.autoApprove += 1;
      else if (decision.includes('FLAG')) this.metrics.decisionBreakdown.flag += 1;
      else if (decision.includes('REJECT')) this.metrics.decisionBreakdown.reject += 1;
      else if (decision.includes('PROCEED')) this.metrics.decisionBreakdown.proceed += 1;
      else if (decision.includes('HOLD')) this.metrics.decisionBreakdown.hold += 1;
      else if (decision.includes('ESCALATE')) this.metrics.decisionBreakdown.escalate += 1;
      else this.metrics.decisionBreakdown.other += 1;
    }

    if (result.escalate_to_human === true || result.escalation_required === true) {
      this.metrics.escalationsTriggered += 1;
    }
  }

  getMetrics(): MetricsResponse {
    return {
      ...this.metrics,
      uptimeSeconds: Math.floor((Date.now() - this.serverStartTime) / 1000),
      agentsActive: this.agentManager.getAllAgents().filter((a) => a.status === 'active').length,
    };
  }

  getAgentManager(): AgentManager {
    return this.agentManager;
  }

  sendMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    if (this.messageQueue.length > 500) {
      this.messageQueue.shift();
    }
  }

  // ── Inter-agent messaging (DB-backed) ──────────────────────────────

  sendAgentMessage(
    from: string,
    to: string,
    type: string,
    payload: Record<string, unknown>
  ): { messageId: string } {
    const db = getDB();
    const messageId = uuid();
    db.prepare(
      `INSERT INTO agent_messages (id, from_agent, to_agent, message_type, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
    ).run(messageId, from, to, type, JSON.stringify(payload));

    // Also queue in-memory for fast access
    this.messageQueue.push({
      messageId,
      from,
      to,
      type: type as AgentMessage['type'],
      payload,
      timestamp: new Date().toISOString(),
    });
    if (this.messageQueue.length > 500) {
      this.messageQueue.shift();
    }

    return { messageId };
  }

  getAgentMessages(agentId: string): Array<Record<string, unknown>> {
    const db = getDB();
    const rows = db
      .prepare(
        `SELECT id, from_agent, to_agent, message_type, payload, status, created_at, processed_at
         FROM agent_messages
         WHERE to_agent = ? AND status = 'pending'
         ORDER BY created_at ASC`
      )
      .all(agentId) as Array<Record<string, unknown>>;

    return rows.map((row) => ({
      id: row.id,
      from: row.from_agent,
      to: row.to_agent,
      type: row.message_type,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload as string) : row.payload,
      status: row.status,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    }));
  }

  // ── Agent access ports ─────────────────────────────────────────────

  createAgentPort(
    agentId: string,
    portName: string
  ): { portId: string; accessKey: string; url: string } {
    const agent = this.agentManager.getAgent(agentId);
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    const db = getDB();
    const portId = uuid();
    const accessKey = uuid();

    db.prepare(
      `INSERT INTO agent_ports (id, agent_id, port_name, access_key, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, datetime('now'))`
    ).run(portId, agentId, portName, accessKey);

    return {
      portId,
      accessKey,
      url: `/api/port/access/${accessKey}`,
    };
  }

  getAgentPorts(agentId?: string): Array<Record<string, unknown>> {
    const db = getDB();
    let rows: Array<Record<string, unknown>>;

    if (agentId) {
      rows = db
        .prepare(
          `SELECT id, agent_id, port_name, access_key, is_active, allowed_operations,
                  rate_limit, total_requests, created_at, last_accessed
           FROM agent_ports
           WHERE agent_id = ?
           ORDER BY created_at DESC`
        )
        .all(agentId) as Array<Record<string, unknown>>;
    } else {
      rows = db
        .prepare(
          `SELECT id, agent_id, port_name, access_key, is_active, allowed_operations,
                  rate_limit, total_requests, created_at, last_accessed
           FROM agent_ports
           ORDER BY created_at DESC`
        )
        .all() as Array<Record<string, unknown>>;
    }

    return rows.map((row) => ({
      id: row.id,
      agentId: row.agent_id,
      portName: row.port_name,
      accessKey: row.access_key,
      isActive: row.is_active === 1,
      allowedOperations:
        typeof row.allowed_operations === 'string'
          ? JSON.parse(row.allowed_operations as string)
          : row.allowed_operations,
      rateLimit: row.rate_limit,
      totalRequests: row.total_requests,
      createdAt: row.created_at,
      lastAccessed: row.last_accessed,
    }));
  }

  async routeViaPort(
    accessKey: string,
    input: string
  ): Promise<{ result: Record<string, unknown>; processingTime: number; model: string; agentId: string }> {
    const db = getDB();

    const port = db
      .prepare(
        `SELECT id, agent_id, port_name, is_active
         FROM agent_ports
         WHERE access_key = ?`
      )
      .get(accessKey) as Record<string, unknown> | undefined;

    if (!port) {
      throw new Error('Invalid access key');
    }
    if (port.is_active !== 1) {
      throw new Error('Port is disabled');
    }

    const agentId = port.agent_id as string;

    // Increment total_requests and update last_accessed
    db.prepare(
      `UPDATE agent_ports
       SET total_requests = total_requests + 1, last_accessed = datetime('now')
       WHERE id = ?`
    ).run(port.id);

    const { result, processingTime, model } = await this.routeToAgent(agentId, input);

    return { result, processingTime, model, agentId };
  }
}

let orchestratorInstance: NiyantaOrchestrator | null = null;

export function getOrchestrator(): NiyantaOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new NiyantaOrchestrator();
  }
  return orchestratorInstance;
}
