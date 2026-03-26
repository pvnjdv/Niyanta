import { v4 as uuid } from 'uuid';
import { callGroqJSON, callGroq, MODELS } from '../utils/groqClient';
import { AgentMessage } from '../types/agent.types';
import { WorkflowContext } from '../types/workflow.types';
import { AuditLogger } from './AuditLogger';
import { AgentManager } from './AgentManager';
import { MetricsResponse } from '../types/api.types';

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
}

let orchestratorInstance: NiyantaOrchestrator | null = null;

export function getOrchestrator(): NiyantaOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new NiyantaOrchestrator();
  }
  return orchestratorInstance;
}
