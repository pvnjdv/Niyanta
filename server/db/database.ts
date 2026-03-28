import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
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

  seedDefaultAgents();
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

const AGENT_SEEDS: AgentSeed[] = [
  {
    id: 'meeting', name: 'Meeting Intelligence', subtitle: 'Transcript to action',
    icon: 'MI', color: '#666666', glow: 'rgba(102,102,102,0.2)',
    capabilities: ['summary', 'decisions', 'tasks', 'risks'],
    description: 'Extracts outcomes from meeting transcripts.',
    systemPrompt: 'You are the Meeting Intelligence Agent. Analyze meeting transcripts and extract summary, attendees, decisions, tasks (with owners and deadlines), risks, sentiment, and WHY-CHAIN audit trail. Respond only with valid JSON containing: summary, attendees, decisions, tasks, risks, sentiment, whyChain.'
  },
  {
    id: 'invoice', name: 'Invoice Processor', subtitle: 'AP approval intelligence',
    icon: 'IP', color: '#888888', glow: 'rgba(136,136,136,0.2)',
    capabilities: ['validation', 'decisioning', 'anomaly checks'],
    description: 'Validates invoices and makes decision recommendations.',
    systemPrompt: 'You are the Invoice Processing Agent. Analyze invoice data and decide AUTO-APPROVE, FLAG, or REJECT based on amount thresholds, anomalies, vendor history, and completeness. Return strict JSON with: decision, confidence, reason, lineItems, anomalies, complianceChecks, whyChain.'
  },
  {
    id: 'document', name: 'Document Intelligence', subtitle: 'Document understanding',
    icon: 'DI', color: '#AAAAAA', glow: 'rgba(170,170,170,0.2)',
    capabilities: ['classification', 'field extraction', 'validation'],
    description: 'Classifies and extracts document data.',
    systemPrompt: 'You are the Document Intelligence Agent. Detect document type, extract structured fields, identify missing required fields, validate data formats, and flag discrepancies. Return strict JSON with: documentType, confidence, extractedFields, missingFields, validationStatus, flags, whyChain.'
  },
];

function seedDefaultAgents(): void {
  const conn = db;
  const count = conn.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  if (count.count > 0) return;

  const insertWorkflow = conn.prepare(
    `INSERT OR IGNORE INTO workflows (id, name, description, nodes, edges, status, category, is_agent, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', 'agent', 1, datetime('now'), datetime('now'))`
  );

  const insertAgent = conn.prepare(
    `INSERT OR IGNORE INTO agents (id, name, subtitle, capabilities, status, color, icon, glow, description, system_prompt, workflow_id, created_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, datetime('now'))`
  );

  for (const agent of AGENT_SEEDS) {
    const workflowId = `wf_agent_${agent.id}`;

    // Build agent workflow: trigger → llm_analysis → notification
    const triggerId = `${agent.id}_trigger`;
    const llmId = `${agent.id}_llm`;
    const notifyId = `${agent.id}_notify`;

    const nodes = [
      { instanceId: triggerId, nodeType: 'manual_trigger', name: 'Input Trigger', config: {}, position: { x: 100, y: 200 } },
      { instanceId: llmId, nodeType: 'llm_analysis', name: `${agent.name} Analysis`, config: { prompt: agent.systemPrompt }, position: { x: 400, y: 200 } },
      { instanceId: notifyId, nodeType: 'notification', name: 'Result Output', config: { channel: 'internal', message: 'Agent execution complete' }, position: { x: 700, y: 200 } },
    ];

    const edges = [
      { id: `e_${triggerId}_${llmId}`, fromNodeId: triggerId, toNodeId: llmId },
      { id: `e_${llmId}_${notifyId}`, fromNodeId: llmId, toNodeId: notifyId },
    ];

    insertWorkflow.run(
      workflowId,
      `${agent.name} Agent Workflow`,
      `Workflow backing the ${agent.name} agent`,
      JSON.stringify(nodes),
      JSON.stringify(edges)
    );

    insertAgent.run(
      agent.id, agent.name, agent.subtitle,
      JSON.stringify(agent.capabilities), agent.color, agent.icon,
      agent.glow, agent.description, agent.systemPrompt, workflowId
    );
  }
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
