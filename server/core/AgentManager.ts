import { AgentDefinition } from '../types/agent.types';
import { v4 as uuid } from 'uuid';

export class AgentManager {
  private agents: Map<string, AgentDefinition>;
  private dbLoaded: boolean = false;

  constructor() {
    this.agents = new Map();
    this.registerAllAgents();
    this.loadFromDB();
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  getAgentByWorkflowId(workflowId: string): AgentDefinition | undefined {
    return this.getAllAgents().find((a) => (a as any).workflow_id === workflowId);
  }

  createAgent(agent: Partial<AgentDefinition> & { name: string; systemPrompt: string }): AgentDefinition {
    const id = agent.agent_id || `agent_${uuid().slice(0, 8)}`;
    const def: AgentDefinition = {
      agent_id: id,
      name: agent.name,
      subtitle: agent.subtitle || '',
      icon: agent.icon || id.slice(0, 2).toUpperCase(),
      color: agent.color || '#64748b',
      glow: agent.glow || 'rgba(100,116,139,0.2)',
      capabilities: agent.capabilities || [],
      status: 'active',
      systemPrompt: agent.systemPrompt,
      description: agent.description || '',
    };
    this.agents.set(id, def);
    return def;
  }

  updateAgent(id: string, updates: Partial<AgentDefinition>): boolean {
    const existing = this.agents.get(id);
    if (!existing) return false;
    this.agents.set(id, { ...existing, ...updates, agent_id: id });
    return true;
  }

  deleteAgent(id: string): boolean {
    return this.agents.delete(id);
  }

  private getDBConnection(): any | null {
    try {
      const { getDB } = require('../db/database');
      return getDB();
    } catch {
      return null;
    }
  }

  private tokenizeText(...parts: Array<string | undefined>): string[] {
    return parts
      .filter(Boolean)
      .flatMap((part) => String(part).toLowerCase().split(/[^a-z0-9]+/g))
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  }

  private readCanvasLayout(agentId: string): Array<Record<string, unknown>> {
    const db = this.getDBConnection();
    if (!db) {
      return [];
    }

    const row = db
      .prepare('SELECT layout_json FROM agent_canvas_layouts WHERE agent_id = ?')
      .get(agentId) as { layout_json?: string | null } | undefined;
    const fallback = db
      .prepare('SELECT canvas_layout FROM agents WHERE id = ?')
      .get(agentId) as { canvas_layout?: string | null } | undefined;

    const raw = row?.layout_json || fallback?.canvas_layout;
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
    } catch {
      return [];
    }
  }

  private getOrderedWorkflowIdsFromCanvas(agentId: string): string[] {
    const layout = this.readCanvasLayout(agentId);
    if (layout.length === 0) {
      return [];
    }

    const workflowBlocks = layout.filter(
      (item) => item.refId && item.refId !== '__start__' && item.refId !== '__end__' && item.refId !== '__edges__'
    );
    if (workflowBlocks.length === 0) {
      return [];
    }

    const nodeById = new Map(
      workflowBlocks.map((item) => [String(item.id || item.refId), item])
    );
    let rawEdges: Array<Record<string, unknown>> = [];

    const edgeMeta = layout.find((item) => item.refId === '__edges__');
    try {
      rawEdges = edgeMeta?.inputInfo ? (JSON.parse(String(edgeMeta.inputInfo)) as Array<Record<string, unknown>>) : [];
    } catch {
      rawEdges = [];
    }

    const adjacency = new Map<string, string[]>();
    for (const edge of rawEdges) {
      const from = String(edge.from || edge.fromNodeId || '');
      const to = String(edge.to || edge.toNodeId || '');
      if (!from || !to || from === to) {
        continue;
      }
      const targets = adjacency.get(from) || [];
      targets.push(to);
      adjacency.set(from, targets);
    }

    const visitQueue = ['__start__'];
    const visited = new Set<string>();
    const workflowIds: string[] = [];

    while (visitQueue.length > 0) {
      const nodeId = visitQueue.shift();
      if (!nodeId || visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);
      const canvasNode = nodeById.get(nodeId);
      if (canvasNode?.blockType === 'workflow' && canvasNode.refId) {
        const workflowId = String(canvasNode.refId);
        if (!workflowIds.includes(workflowId)) {
          workflowIds.push(workflowId);
        }
      }

      const nextNodes = adjacency.get(nodeId) || [];
      nextNodes.forEach((nextNodeId) => {
        if (!visited.has(nextNodeId)) {
          visitQueue.push(nextNodeId);
        }
      });
    }

    return workflowIds;
  }

  getExecutableWorkflowPlan(
    agentId: string,
    input: string,
    workflowContext?: Record<string, unknown>,
    preferredWorkflowIds: string[] = []
  ): Array<{ workflowId: string; name: string; reason: string }> {
    const db = this.getDBConnection();
    const agent = this.getAgent(agentId);
    if (!db || !agent) {
      return [];
    }

    const linkedRows = db
      .prepare(
        `SELECT aw.workflow_id, w.name, w.description, w.category, w.tags, w.triggers, w.status
         FROM agent_workflows aw
         JOIN workflows w ON w.id = aw.workflow_id
         WHERE aw.agent_id = ?
         ORDER BY aw.created_at ASC`
      )
      .all(agentId) as Array<Record<string, unknown>>;

    const linkedWorkflowMap = new Map(linkedRows.map((row) => [String(row.workflow_id), row]));
    const preferredSet = new Set(preferredWorkflowIds.filter(Boolean));
    const fromCanvas = this.getOrderedWorkflowIdsFromCanvas(agentId);
    const orderedIds: string[] = [];
    const pushUnique = (workflowId: string) => {
      if (workflowId && !orderedIds.includes(workflowId)) {
        orderedIds.push(workflowId);
      }
    };

    preferredWorkflowIds.forEach(pushUnique);
    fromCanvas.forEach(pushUnique);
    linkedRows.forEach((row) => pushUnique(String(row.workflow_id)));

    if (orderedIds.length === 0 && (agent as AgentDefinition & { workflow_id?: string }).workflow_id) {
      pushUnique(String((agent as AgentDefinition & { workflow_id?: string }).workflow_id));
    }

    if (orderedIds.length === 0) {
      const keywords = new Set(
        this.tokenizeText(
          input,
          agent.name,
          agent.description,
          ...(agent.capabilities || []),
          workflowContext ? JSON.stringify(workflowContext) : ''
        )
      );

      const discovered = this.discoverWorkflows();
      discovered
        .map((workflow: any) => {
          const workflowKeywords = new Set(
            this.tokenizeText(
              workflow.name,
              workflow.description,
              workflow.category,
              ...(Array.isArray(workflow.tags) ? workflow.tags : []),
              ...(Array.isArray(workflow.triggers) ? workflow.triggers : [])
            )
          );
          let score = 0;
          keywords.forEach((keyword) => {
            if (workflowKeywords.has(keyword)) {
              score += 1;
            }
          });
          return { workflow, score };
        })
        .filter((item: { score: number }) => item.score > 0)
        .sort((left: { score: number }, right: { score: number }) => right.score - left.score)
        .slice(0, 3)
        .forEach((item: { workflow: Record<string, unknown> }) => pushUnique(String(item.workflow.id)));
    }

    return orderedIds.map((workflowId) => {
      const row =
        linkedWorkflowMap.get(workflowId) ||
        (db
          .prepare('SELECT id as workflow_id, name, description, category FROM workflows WHERE id = ?')
          .get(workflowId) as Record<string, unknown> | undefined);

      return {
        workflowId,
        name: String(row?.name || workflowId),
        reason: preferredSet.has(workflowId)
          ? 'agent analysis requested this workflow'
          : fromCanvas.includes(workflowId)
            ? 'canvas execution path'
            : linkedWorkflowMap.has(workflowId)
              ? 'linked workflow'
              : 'backing workflow fallback',
      };
    });
  }

  // Phase 3.2: Workflow discovery for agents
  discoverWorkflows(options?: { category?: string; tags?: string[]; triggers?: string[] }): any[] {
    try {
      const { getDB } = require('../db/database');
      const db = getDB();
      
      let query = 'SELECT id, name, description, category, tags, triggers FROM workflows WHERE status = ? AND allow_agent_invocation = 1 AND COALESCE(is_agent, 0) = 0';
      const params: any[] = ['active'];

      if (options?.category) {
        query += ' AND category = ?';
        params.push(options.category);
      }

      const workflows = db.prepare(query).all(...params);
      
      // Parse JSON fields and apply additional filters
      return workflows
        .map((wf: any) => ({
          ...wf,
          tags: JSON.parse(wf.tags || '[]'),
          triggers: JSON.parse(wf.triggers || '[]')
        }))
        .filter((wf: any) => {
          // Filter by tags if specified
          if (options?.tags && options.tags.length > 0) {
            const hasTags = options.tags.some(tag => wf.tags.includes(tag));
            if (!hasTags) return false;
          }
          
          // Filter by triggers if specified
          if (options?.triggers && options.triggers.length > 0) {
            const hasTriggers = options.triggers.some(trigger => wf.triggers.includes(trigger));
            if (!hasTriggers) return false;
          }
          
          return true;
        });
    } catch (error) {
      console.error('Workflow discovery error:', error);
      return [];
    }
  }

  // Phase 3.3: Agent-initiated workflow invocation
  async invokeWorkflow(workflowId: string, agentId: string, context: any): Promise<any> {
    try {
      const { getDB } = require('../db/database');
      const db = getDB();
      
      // Verify workflow exists and is invocable
      const workflow = db.prepare(
        'SELECT id, name, status, allow_agent_invocation FROM workflows WHERE id = ?'
      ).get(workflowId);
      
      if (!workflow) {
        throw new Error('Workflow not found');
      }
      
      if (workflow.status !== 'active') {
        throw new Error('Workflow is not active');
      }
      
      if (!workflow.allow_agent_invocation) {
        throw new Error('Workflow does not allow agent invocation');
      }
      
      // Import WorkflowEngine to execute the workflow
      const { WorkflowEngine } = require('../core/WorkflowEngine');
      const engine = new WorkflowEngine();
      
      // Create run with agent as trigger
      const runId = engine.createRun(workflowId, `agent:${agentId}`);
      
      // Execute with agent context
      const result = await engine.execute(workflowId, runId, {
        ...context,
        _agent: {
          agentId,
          invokedAt: new Date().toISOString(),
        }
      });
      
      return {
        success: result.success,
        status: result.status,
        waitingForApproval: result.waitingForApproval || false,
        workflowId,
        workflowName: workflow.name,
        runId,
        context: result.context,
        error: result.error,
      };
    } catch (error) {
      console.error('Workflow invocation error:', error);
      throw error;
    }
  }

  private loadFromDB(): void {
    try {
      // Lazy import to avoid circular dependency
      const { getDB } = require('../db/database');
      const db = getDB();
      const rows = db.prepare('SELECT * FROM agents WHERE status = ?').all('active') as Array<Record<string, unknown>>;

      for (const row of rows) {
        const id = row.id as string;
        // Only override if not already loaded or if DB has more data
        const existing = this.agents.get(id);
        const dbAgent: AgentDefinition = {
          agent_id: id,
          name: (row.name as string) || existing?.name || id,
          subtitle: (row.subtitle as string) || existing?.subtitle || '',
          icon: (row.icon as string) || existing?.icon || id.slice(0, 2).toUpperCase(),
          color: (row.color as string) || existing?.color || '#64748b',
          glow: (row.glow as string) || existing?.glow || '',
          capabilities: row.capabilities ? JSON.parse(row.capabilities as string) : existing?.capabilities || [],
          status: (row.status as 'active' | 'disabled' | 'error') || 'active',
          systemPrompt: (row.system_prompt as string) || existing?.systemPrompt || '',
          description: (row.description as string) || existing?.description || '',
        };
        // Attach workflow_id if present
        if (row.workflow_id) {
          (dbAgent as any).workflow_id = row.workflow_id;
        }
        this.agents.set(id, dbAgent);
      }
      this.dbLoaded = true;
    } catch {
      // DB not ready yet, use hardcoded defaults
    }
  }

  private registerAllAgents(): void {
    const agentDefinitions: AgentDefinition[] = [
      {
        agent_id: 'meeting', name: 'Meeting Intelligence', subtitle: 'Transcript to action',
        icon: 'MI', color: '#666666', glow: 'rgba(102,102,102,0.2)',
        capabilities: ['summary', 'decisions', 'tasks', 'risks'], status: 'active',
        description: 'Extracts outcomes from meeting transcripts.',
        systemPrompt: 'You are the Meeting Intelligence Agent. Analyze meeting transcripts and extract summary, attendees, decisions, tasks, risks, sentiment, and WHY-CHAIN audit. Respond only with valid JSON.'
      },
      {
        agent_id: 'invoice', name: 'Invoice Processor', subtitle: 'AP approval intelligence',
        icon: 'IP', color: '#888888', glow: 'rgba(136,136,136,0.2)',
        capabilities: ['validation', 'decisioning', 'anomaly checks'], status: 'active',
        description: 'Validates invoices and makes decision recommendations.',
        systemPrompt: 'You are the Invoice Processing Agent. Decide AUTO-APPROVE, FLAG, or REJECT. Return strict JSON with decision, reason, anomalies, compliance checks, and audit.'
      },
      {
        agent_id: 'document', name: 'Document Intelligence', subtitle: 'Document understanding',
        icon: 'DI', color: '#AAAAAA', glow: 'rgba(170,170,170,0.2)',
        capabilities: ['classification', 'field extraction', 'validation'], status: 'active',
        description: 'Classifies and extracts document data.',
        systemPrompt: 'You are the Document Intelligence Agent. Detect document type, fields, missing fields, and validation status. Return strict JSON only.'
      },
      {
        agent_id: 'finance_ops', name: 'Finance Operations', subtitle: 'Budget & expense intelligence',
        icon: 'FO', color: '#059669', glow: 'rgba(5,150,105,0.2)',
        capabilities: ['budget analysis', 'expense tracking', 'anomaly detection', 'forecasting'], status: 'active',
        description: 'Analyzes financial data, monitors budgets, and detects expense anomalies.',
        systemPrompt: 'You are the Finance Operations Agent. Analyze financial data including budgets, expenses, and invoices. Detect anomalies and generate insights. Return strict JSON with: summary, budgetStatus, anomalies, recommendations, riskLevel, whyChain.'
      },
      {
        agent_id: 'hr_ops', name: 'HR Operations', subtitle: 'People & workforce intelligence',
        icon: 'HR', color: '#EC4899', glow: 'rgba(236,72,153,0.2)',
        capabilities: ['onboarding', 'leave management', 'compliance', 'performance tracking'], status: 'active',
        description: 'Manages HR workflows including onboarding, leave requests, and compliance.',
        systemPrompt: 'You are the HR Operations Agent. Handle employee requests including onboarding, leave management, and policy queries. Return strict JSON with: requestType, decision, reason, nextSteps, complianceStatus, whyChain.'
      },
      {
        agent_id: 'it_ops', name: 'IT Operations', subtitle: 'Access & incident management',
        icon: 'IT', color: '#3B82F6', glow: 'rgba(59,130,246,0.2)',
        capabilities: ['access requests', 'incident management', 'asset tracking', 'SLA monitoring'], status: 'active',
        description: 'Processes access requests, incidents, and asset workflows with priority and SLA.',
        systemPrompt: 'You are the IT Operations Agent inside Niyanta AI. Process access requests, incidents, and asset workflows with priority and SLA. Return strict JSON with request_type, priority, affected_systems, access_requests, incident, assets, escalation_required, audit.'
      },
      {
        agent_id: 'compliance', name: 'Compliance', subtitle: 'Policy & regulatory intelligence',
        icon: 'CO', color: '#F59E0B', glow: 'rgba(245,158,11,0.2)',
        capabilities: ['policy evaluation', 'regulatory checks', 'risk scoring', 'violation detection'], status: 'active',
        description: 'Evaluates policy violations, regulatory risks, and compliance gaps.',
        systemPrompt: 'You are the Compliance Agent inside Niyanta AI. Evaluate policy violations, regulatory risks, and compliance gaps. Return strict JSON with compliance_status, regulations_checked, violations, risk_score, recommended_actions, audit.'
      },
      {
        agent_id: 'security', name: 'Security Monitor', subtitle: 'Threat & incident response',
        icon: 'SM', color: '#EF4444', glow: 'rgba(239,68,68,0.2)',
        capabilities: ['incident classification', 'threat assessment', 'response planning', 'escalation'], status: 'active',
        description: 'Classifies security incidents and defines immediate response actions.',
        systemPrompt: 'You are the Security Monitor Agent inside Niyanta AI. Classify incidents by CRITICAL/HIGH/MEDIUM/LOW and define immediate response. Return strict JSON with severity, confidence, affected, immediate_actions, escalation, regulatory_impact, audit.'
      },
      {
        agent_id: 'procurement', name: 'Procurement', subtitle: 'Purchase & vendor intelligence',
        icon: 'PR', color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)',
        capabilities: ['purchase approval', 'vendor evaluation', 'policy checks', 'compliance flags'], status: 'active',
        description: 'Applies thresholds and quote requirements to build approval chains.',
        systemPrompt: 'You are the Procurement Agent inside Niyanta AI. Apply thresholds and quote requirements to build approval chain. Return strict JSON with decision, approval_chain, policy_checks, compliance_flags, timeline, next_steps, audit.'
      },
      {
        agent_id: 'workflow', name: 'Workflow Intelligence', subtitle: 'Optimization & routing',
        icon: 'WI', color: '#06B6D4', glow: 'rgba(6,182,212,0.2)',
        capabilities: ['workflow analysis', 'optimization', 'routing recommendations', 'risk assessment'], status: 'active',
        description: 'Analyzes workflows and suggests optimization and routing improvements.',
        systemPrompt: 'You are the Workflow Intelligence Agent inside Niyanta AI. Analyze workflow data and suggest optimization and routing improvements. Return strict JSON with workflow_analysis, optimization_suggestions, routing_recommendations, risk_assessment, audit.'
      },
    ];

    for (const agent of agentDefinitions) {
      this.agents.set(agent.agent_id, agent);
    }
  }
}
