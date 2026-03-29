import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import {
  DEFAULT_AGENT_BLUEPRINTS,
  buildAgentCanvasLayout,
  buildAgentWorkflowDefinition,
  getDefaultAgentCopyId,
} from '../config/agentBlueprints';
import { workflowTemplates } from '../templates/workflow-templates';

const DB_PATH = process.env.DB_PATH || './niyanta.db';
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db: Database.Database;

export function getDB(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema();
  }
  return db;
}

function initializeSchema(): void {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      db.prepare(`${statement};`).run();
    } catch {
      // Table may already exist with different schema, ignore
    }
  }

  // Add new columns to existing tables if they don't exist
  const migrations = [
    'ALTER TABLE agents ADD COLUMN icon TEXT DEFAULT "AG"',
    'ALTER TABLE agents ADD COLUMN glow TEXT',
    'ALTER TABLE agents ADD COLUMN description TEXT',
    'ALTER TABLE agents ADD COLUMN system_prompt TEXT',
    'ALTER TABLE agents ADD COLUMN workflow_id TEXT',
    'ALTER TABLE workflows ADD COLUMN is_agent INTEGER DEFAULT 0',
    'ALTER TABLE workflows ADD COLUMN category TEXT',
    'ALTER TABLE workflows ADD COLUMN tags TEXT DEFAULT "[]"',
    'ALTER TABLE workflows ADD COLUMN triggers TEXT DEFAULT "[]"',
    'ALTER TABLE workflows ADD COLUMN allow_agent_invocation INTEGER DEFAULT 1',
    'ALTER TABLE workflows ADD COLUMN is_default INTEGER DEFAULT 0',
    'ALTER TABLE agents ADD COLUMN is_template INTEGER DEFAULT 0',
    'ALTER TABLE agents ADD COLUMN canvas_layout TEXT',
    'ALTER TABLE agents ADD COLUMN is_default INTEGER DEFAULT 0',
    'ALTER TABLE pending_approvals ADD COLUMN workflow_id TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN workflow_name TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN node_id TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN node_name TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN priority TEXT DEFAULT "medium"',
    'ALTER TABLE pending_approvals ADD COLUMN deadline TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN escalation_policy TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN decision_comment TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN decision_data TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN resolved_at TEXT',
    'ALTER TABLE pending_approvals ADD COLUMN resolved_by TEXT',
  ];
  for (const m of migrations) {
    try { db.prepare(m).run(); } catch { /* column already exists */ }
  }
  
  // Create agent_workflows junction table
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS agent_workflows (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        workflow_id TEXT NOT NULL,
        can_trigger INTEGER DEFAULT 1,
        can_modify INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
        FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
        UNIQUE(agent_id, workflow_id)
      )
    `).run();
    
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_agent_workflows_agent ON agent_workflows(agent_id)
    `).run();
    
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_agent_workflows_workflow ON agent_workflows(workflow_id)
    `).run();
  } catch { /* table already exists */ }

  // Dedicated per-agent canvas persistence (one canvas per agent)
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS agent_canvas_layouts (
        agent_id TEXT PRIMARY KEY,
        layout_json TEXT NOT NULL DEFAULT '[]',
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
      )
    `).run();

    // Backfill existing canvas layouts from legacy agents.canvas_layout column
    db.prepare(`
      INSERT OR IGNORE INTO agent_canvas_layouts (agent_id, layout_json, updated_at)
      SELECT id, canvas_layout, datetime('now')
      FROM agents
      WHERE canvas_layout IS NOT NULL AND TRIM(canvas_layout) != ''
    `).run();
  } catch { /* table may already exist */ }

  syncTemplateAgents();
  seedCopyableDefaultAgents();
  seedDefaultNodes();
  seedDefaultWorkflows();
}

interface AgentSeed {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  capabilities: string[];
  description: string;
  systemPrompt: string;
}

const TEMPLATE_AGENT_SEEDS: AgentSeed[] = DEFAULT_AGENT_BLUEPRINTS.map((agent) => ({
  id: agent.id,
  name: agent.name,
  subtitle: agent.subtitle,
  icon: agent.icon,
  color: agent.color,
  glow: agent.glow,
  capabilities: agent.capabilities,
  description: agent.description,
  systemPrompt: agent.systemPrompt,
}));

const AGENT_SEEDS: AgentSeed[] = TEMPLATE_AGENT_SEEDS;

function syncSeededAgent(
  agent: AgentSeed,
  options: { agentId: string; isTemplate: number; isDefault: number }
): void {
  const conn = db;
  const { workflowId, name, description, nodes, edges } = buildAgentWorkflowDefinition(agent, options.agentId);
  const canvasLayout = buildAgentCanvasLayout(agent, workflowId);

  conn.prepare(
    `INSERT OR IGNORE INTO workflows (id, name, description, nodes, edges, status, category, is_agent, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', 'agent', 1, datetime('now'), datetime('now'))`
  ).run(workflowId, name, description, JSON.stringify(nodes), JSON.stringify(edges));

  conn.prepare(
    `UPDATE workflows
     SET name = ?, description = ?, nodes = ?, edges = ?, status = 'active', category = 'agent', is_agent = 1, updated_at = datetime('now')
     WHERE id = ?`
  ).run(name, description, JSON.stringify(nodes), JSON.stringify(edges), workflowId);

  conn.prepare(
    `INSERT OR IGNORE INTO agents (
      id, name, subtitle, capabilities, status, color, icon, glow, description, system_prompt, workflow_id, is_template, is_default, canvas_layout, created_at
     ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(
    options.agentId,
    agent.name,
    agent.subtitle,
    JSON.stringify(agent.capabilities),
    agent.color,
    agent.icon,
    agent.glow,
    agent.description,
    agent.systemPrompt,
    workflowId,
    options.isTemplate,
    options.isDefault,
    JSON.stringify(canvasLayout)
  );

  conn.prepare(
    `UPDATE agents
     SET name = ?, subtitle = ?, capabilities = ?, status = 'active', color = ?, icon = ?, glow = ?, description = ?, system_prompt = ?, workflow_id = ?, is_template = ?, is_default = ?, canvas_layout = ?
     WHERE id = ?`
  ).run(
    agent.name,
    agent.subtitle,
    JSON.stringify(agent.capabilities),
    agent.color,
    agent.icon,
    agent.glow,
    agent.description,
    agent.systemPrompt,
    workflowId,
    options.isTemplate,
    options.isDefault,
    JSON.stringify(canvasLayout),
    options.agentId
  );

  conn.prepare(
    `INSERT INTO agent_canvas_layouts (agent_id, layout_json, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(agent_id) DO UPDATE SET
       layout_json = excluded.layout_json,
       updated_at = datetime('now')`
  ).run(options.agentId, JSON.stringify(canvasLayout));

  conn.prepare(
    `INSERT OR IGNORE INTO agent_workflows (id, agent_id, workflow_id, can_trigger, can_modify, created_at)
     VALUES (?, ?, ?, 1, 0, datetime('now'))`
  ).run(`aw_${options.agentId}_${workflowId}`, options.agentId, workflowId);
}

function syncTemplateAgents(): void {
  TEMPLATE_AGENT_SEEDS.forEach((agent) => {
    syncSeededAgent(agent, { agentId: agent.id, isTemplate: 1, isDefault: 0 });
  });
}

function seedCopyableDefaultAgents(): void {
  AGENT_SEEDS.forEach((agent) => {
    syncSeededAgent(agent, {
      agentId: getDefaultAgentCopyId(agent.id),
      isTemplate: 0,
      isDefault: 1,
    });
  });
}

function seedDefaultNodes(): void {
  // Node seeding happens via NodeRegistry at startup.
}

function seedDefaultWorkflows(): void {
  const conn = db;
  const existing = conn.prepare("SELECT COUNT(*) as count FROM workflows WHERE is_default = 1").get() as { count: number };
  if (existing.count > 0) return;

  const insert = conn.prepare(`
    INSERT OR IGNORE INTO workflows
      (id, name, description, nodes, edges, status, category, tags, triggers, allow_agent_invocation, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, 1, 1, datetime('now'), datetime('now'))
  `);

  for (const tmpl of workflowTemplates) {
    const workflowId = `default_${tmpl.id}`;

    const nodeIdMap: Record<string, string> = {};
    const nodes = tmpl.nodes.map(n => {
      const newId = `node-${uuid()}`;
      nodeIdMap[n.id] = newId;
      return { instanceId: newId, nodeType: n.type, name: n.name, config: n.config, position: n.position, retryConfig: { maxRetries: 3, timeout: 30, failurePolicy: 'retry' } };
    });

    const edges = tmpl.edges.map(e => ({
      id: `edge-${uuid()}`,
      fromNodeId: nodeIdMap[e.fromNodeId],
      toNodeId: nodeIdMap[e.toNodeId],
      condition: e.condition,
    }));

    insert.run(
      workflowId, tmpl.name, tmpl.description,
      JSON.stringify(nodes), JSON.stringify(edges),
      tmpl.category,
      JSON.stringify(tmpl.tags),
      JSON.stringify(tmpl.triggers),
    );
  }
}

export default getDB;
