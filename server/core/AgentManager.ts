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
    ];

    for (const agent of agentDefinitions) {
      this.agents.set(agent.agent_id, agent);
    }
  }
}
