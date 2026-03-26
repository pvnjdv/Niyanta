-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  capabilities TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','disabled','error')),
  color TEXT NOT NULL,
  last_activity TEXT,
  total_runs INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL UNIQUE,
  description TEXT,
  config_schema TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  nodes TEXT NOT NULL,
  edges TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','active','disabled')),
  category TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL REFERENCES workflows(id),
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','WAITING_APPROVAL','FAILED','COMPLETED')),
  context TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  triggered_by TEXT,
  error_message TEXT,
  FOREIGN KEY(workflow_id) REFERENCES workflows(id)
);

-- Workflow logs table
CREATE TABLE IF NOT EXISTS workflow_logs (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('running','completed','failed','waiting','skipped')),
  input_snapshot TEXT,
  output_snapshot TEXT,
  error TEXT,
  duration_ms INTEGER,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(run_id) REFERENCES workflow_runs(id)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  event_type TEXT NOT NULL,
  event TEXT NOT NULL,
  decision TEXT,
  input_preview TEXT,
  processing_time_ms INTEGER,
  metadata TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('excel','csv','json','pdf','txt')),
  path TEXT NOT NULL,
  size_bytes INTEGER,
  generated_by TEXT,
  workflow_run_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Pending approvals table
CREATE TABLE IF NOT EXISTS pending_approvals (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT,
  FOREIGN KEY(workflow_run_id) REFERENCES workflow_runs(id)
);
