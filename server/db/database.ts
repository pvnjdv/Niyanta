import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
    getDB().prepare(`${statement};`).run();
  }

  seedDefaultAgents();
  seedDefaultNodes();
}

function seedDefaultAgents(): void {
  const conn = getDB();
  const count = conn.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };

  if (count.count === 0) {
    const insert = conn.prepare(
      `INSERT INTO agents (id, name, subtitle, capabilities, status, color) VALUES (?, ?, ?, ?, ?, ?)`
    );

    const defaults: Array<[string, string, string, string[], string, string]> = [
      ['meeting', 'Meeting Intelligence', 'Transcript to action', ['summary', 'decisions', 'tasks'], 'active', '#00D4FF'],
      ['invoice', 'Invoice Processor', 'Payables and anomalies', ['validation', 'anomaly-detection'], 'active', '#FFB800'],
      ['hr', 'HR Operations', 'Onboarding workflows', ['onboarding', 'access-plan'], 'active', '#00E676'],
      ['procurement', 'Procurement', 'Purchase approvals', ['routing', 'policy-check'], 'active', '#FF6B6B'],
      ['security', 'Security Monitor', 'Incident response', ['triage', 'containment'], 'active', '#FF4488'],
      ['compliance', 'Compliance Agent', 'Regulatory checks', ['gdpr', 'pci', 'sox'], 'active', '#A78BFA'],
      ['document', 'Document Intelligence', 'Classification and extraction', ['classification', 'field-extraction'], 'active', '#F59E0B'],
      ['monitoring', 'Monitoring Agent', 'SLA and bottleneck insights', ['sla', 'ops-insights'], 'active', '#60A5FA'],
      ['workflow', 'Workflow Intelligence', 'Optimization planning', ['optimization', 'routing'], 'active', '#34D399'],
      ['it_ops', 'IT Operations', 'Access and incidents', ['it-requests', 'incident-routing'], 'active', '#F472B6']
    ];

    for (const row of defaults) {
      insert.run(row[0], row[1], row[2], JSON.stringify(row[3]), row[4], row[5]);
    }
  }
}

function seedDefaultNodes(): void {
  // Node seeding happens via NodeRegistry at startup.
}

export default getDB;
