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
    ];

    for (const agent of agentDefinitions) {
      this.agents.set(agent.agent_id, agent);
    }
  }
}
