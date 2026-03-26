import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

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
  ];
  for (const m of migrations) {
    try { db.prepare(m).run(); } catch { /* column already exists */ }
  }

  seedDefaultAgents();
  seedDefaultNodes();
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
    icon: 'MI', color: '#00D4FF', glow: 'rgba(0,212,255,0.2)',
    capabilities: ['summary', 'decisions', 'tasks', 'risks'],
    description: 'Extracts outcomes from meeting transcripts.',
    systemPrompt: 'You are the Meeting Intelligence Agent. Analyze meeting transcripts and extract summary, attendees, decisions, tasks (with owners and deadlines), risks, sentiment, and WHY-CHAIN audit trail. Respond only with valid JSON containing: summary, attendees, decisions, tasks, risks, sentiment, whyChain.'
  },
  {
    id: 'invoice', name: 'Invoice Processor', subtitle: 'AP approval intelligence',
    icon: 'IP', color: '#FFB800', glow: 'rgba(255,184,0,0.2)',
    capabilities: ['validation', 'decisioning', 'anomaly checks'],
    description: 'Validates invoices and makes decision recommendations.',
    systemPrompt: 'You are the Invoice Processing Agent. Analyze invoice data and decide AUTO-APPROVE, FLAG, or REJECT based on amount thresholds, anomalies, vendor history, and completeness. Return strict JSON with: decision, confidence, reason, lineItems, anomalies, complianceChecks, whyChain.'
  },
  {
    id: 'hr', name: 'HR Operations', subtitle: 'Onboarding planner',
    icon: 'HR', color: '#00E676', glow: 'rgba(0,230,118,0.2)',
    capabilities: ['onboarding', 'access planning', 'compliance'],
    description: 'Creates structured onboarding plans.',
    systemPrompt: 'You are the HR Operations Agent. Build comprehensive onboarding plans with required documents, system access (least-privilege), day-by-day checklist, scheduled meetings, equipment needs, and compliance requirements. Return strict JSON with: plan, documents, accessList, checklist, meetings, equipment, whyChain.'
  },
  {
    id: 'procurement', name: 'Procurement', subtitle: 'Purchase governance',
    icon: 'PR', color: '#FF6B6B', glow: 'rgba(255,107,107,0.2)',
    capabilities: ['approval routing', 'policy checks', 'vendor guidance'],
    description: 'Routes procurement requests with policy thresholds.',
    systemPrompt: 'You are the Procurement Agent. Evaluate purchase requests against policy thresholds, compute approval chain based on amount and category, check vendor compliance, and provide cost optimization suggestions. Return strict JSON with: decision, approvalChain, policyChecks, vendorNotes, costAnalysis, whyChain.'
  },
  {
    id: 'security', name: 'Security Monitor', subtitle: 'Incident triage',
    icon: 'SM', color: '#FF4488', glow: 'rgba(255,68,136,0.2)',
    capabilities: ['severity classification', 'containment', 'escalation'],
    description: 'Classifies and responds to security incidents.',
    systemPrompt: 'You are the Security Monitor Agent. Classify security incidents by severity (CRITICAL/HIGH/MEDIUM/LOW), determine impact scope, provide immediate containment actions, escalation path, and regulatory notification requirements. Return strict JSON with: severity, classification, impactScope, immediateActions, escalationPath, regulatoryImpact, whyChain.'
  },
  {
    id: 'compliance', name: 'Compliance Agent', subtitle: 'Policy and regulation checks',
    icon: 'CA', color: '#A78BFA', glow: 'rgba(167,139,250,0.2)',
    capabilities: ['regulatory risk', 'violations', 'remediation'],
    description: 'Assesses compliance posture.',
    systemPrompt: 'You are the Compliance Agent. Evaluate regulatory risks (GDPR, SOX, PCI-DSS, HIPAA), identify policy violations, assess risk levels, and provide remediation actions with timelines. Return strict JSON with: overallRisk, violations, regulations, remediationPlan, timeline, whyChain.'
  },
  {
    id: 'document', name: 'Document Intelligence', subtitle: 'Document understanding',
    icon: 'DI', color: '#F59E0B', glow: 'rgba(245,158,11,0.2)',
    capabilities: ['classification', 'field extraction', 'validation'],
    description: 'Classifies and extracts document data.',
    systemPrompt: 'You are the Document Intelligence Agent. Detect document type, extract structured fields, identify missing required fields, validate data formats, and flag discrepancies. Return strict JSON with: documentType, confidence, extractedFields, missingFields, validationStatus, flags, whyChain.'
  },
  {
    id: 'monitoring', name: 'Monitoring Agent', subtitle: 'SLA and ops telemetry',
    icon: 'MO', color: '#60A5FA', glow: 'rgba(96,165,250,0.2)',
    capabilities: ['sla', 'bottlenecks', 'alerts'],
    description: 'Analyzes operational health and SLA risk.',
    systemPrompt: 'You are the Monitoring Agent. Analyze operational metrics for SLA breaches, bottlenecks, capacity issues, and health anomalies. Provide alerts with priority levels and recommended actions. Return strict JSON with: slaStatus, bottlenecks, alerts, healthScore, recommendations, whyChain.'
  },
  {
    id: 'workflow', name: 'Workflow Intelligence', subtitle: 'Optimization advisor',
    icon: 'WI', color: '#34D399', glow: 'rgba(52,211,153,0.2)',
    capabilities: ['critical path', 'optimization', 'routing'],
    description: 'Optimizes workflow design and execution.',
    systemPrompt: 'You are the Workflow Intelligence Agent. Analyze workflow execution data to identify critical paths, parallelization opportunities, redundant steps, and routing optimizations. Return strict JSON with: criticalPath, optimizations, parallelizable, redundancies, estimatedImprovement, whyChain.'
  },
  {
    id: 'it_ops', name: 'IT Operations', subtitle: 'Access and incidents',
    icon: 'IT', color: '#F472B6', glow: 'rgba(244,114,182,0.2)',
    capabilities: ['request triage', 'incident planning', 'asset handling'],
    description: 'Manages IT requests and incident response plans.',
    systemPrompt: 'You are the IT Operations Agent. Process access requests, incident reports, and asset management tasks. Determine priority, SLA tier, required approvals, and step-by-step resolution plan. Return strict JSON with: requestType, priority, slaTier, approvals, resolutionPlan, assets, whyChain.'
  }
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

export default getDB;
