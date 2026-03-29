import { AgentDefinition } from '../types/agent.types';
import { v4 as uuid } from 'uuid';
import { DEFAULT_AGENT_BLUEPRINTS } from '../config/agentBlueprints';
import { buildAgentCanvasGraph, extractWorkflowIdsFromCanvas, resolveCanvasExecutionOrder } from '../utils/agentCanvas';

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

  private getOrderedWorkflowIdsFromCanvas(agentId: string, selectedCanvasNodeIds: string[] = []): string[] {
    const layout = this.readCanvasLayout(agentId);
    if (layout.length === 0) {
      return [];
    }

    return extractWorkflowIdsFromCanvas(layout, selectedCanvasNodeIds);
  }

  getCanvasPlanningContext(agentId: string): {
    blocks: Array<{
      id: string;
      blockType: 'workflow' | 'node';
      refId: string;
      name: string;
      category: string;
      inputInfo: string;
      nextStepIds: string[];
      branch: boolean;
    }>;
    summary: ReturnType<typeof buildAgentCanvasGraph>['summary'];
    decisionPoints: Array<{ id: string; name: string; options: Array<{ id: string; name: string }> }>;
  } {
    const graph = buildAgentCanvasGraph(this.readCanvasLayout(agentId));
    const blocks = graph.blocks
      .filter((block) => block.refId !== '__start__' && block.refId !== '__end__')
      .map((block) => ({
        id: block.id,
        blockType: block.blockType,
        refId: block.refId,
        name: block.name,
        category: block.category,
        inputInfo: block.inputInfo,
        nextStepIds: graph.adjacency.get(block.id) || [],
        branch: (graph.adjacency.get(block.id) || []).length > 1,
      }));

    return {
      blocks,
      summary: graph.summary,
      decisionPoints: blocks
        .filter((block) => block.branch)
        .map((block) => ({
          id: block.id,
          name: block.name,
          options: (graph.adjacency.get(block.id) || []).map((nextNodeId) => ({
            id: nextNodeId,
            name: graph.blockById.get(nextNodeId)?.name || nextNodeId,
          })),
        })),
    };
  }

  getResolvedCanvasPlan(
    agentId: string,
    selectedCanvasNodeIds: string[] = []
  ): Array<{
    id: string;
    blockType: 'workflow' | 'node';
    refId: string;
    name: string;
    category: string;
    inputInfo: string;
    nextStepIds: string[];
  }> {
    const layout = this.readCanvasLayout(agentId);
    const graph = buildAgentCanvasGraph(layout);

    return resolveCanvasExecutionOrder(layout, selectedCanvasNodeIds).map((block) => ({
      id: block.id,
      blockType: block.blockType,
      refId: block.refId,
      name: block.name,
      category: block.category,
      inputInfo: block.inputInfo,
      nextStepIds: graph.adjacency.get(block.id) || [],
    }));
  }

  getExecutableWorkflowPlan(
    agentId: string,
    input: string,
    workflowContext?: Record<string, unknown>,
    preferredWorkflowIds: string[] = [],
    selectedCanvasNodeIds: string[] = []
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
    const fromCanvas = this.getOrderedWorkflowIdsFromCanvas(agentId, selectedCanvasNodeIds);
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
    const agentDefinitions: AgentDefinition[] = DEFAULT_AGENT_BLUEPRINTS.map((agent) => ({
      agent_id: agent.id,
      name: agent.name,
      subtitle: agent.subtitle,
      icon: agent.icon,
      color: agent.color,
      glow: agent.glow,
      capabilities: agent.capabilities,
      status: 'active',
      description: agent.description,
      systemPrompt: agent.systemPrompt,
    }));

    for (const agent of agentDefinitions) {
      this.agents.set(agent.agent_id, agent);
    }
  }
}
