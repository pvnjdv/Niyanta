-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  capabilities TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK(status IN ('active','disabled','error')),
  color TEXT NOT NULL,
  icon TEXT DEFAULT 'AG',
  glow TEXT,
  description TEXT,
  system_prompt TEXT,
  workflow_id TEXT,
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
  tags TEXT DEFAULT '[]',
  triggers TEXT DEFAULT '[]',
  allow_agent_invocation INTEGER DEFAULT 1,
  is_agent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY,
  workflow_id TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','WAITING_APPROVAL','FAILED','COMPLETED')),
  context TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  triggered_by TEXT,
  error_message TEXT
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
  timestamp TEXT DEFAULT (datetime('now'))
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

-- Pending approvals table (Phase 5)
CREATE TABLE IF NOT EXISTS pending_approvals (
  id TEXT PRIMARY KEY,
  workflow_run_id TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context TEXT,
  assigned_to TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low','medium','high','critical')),
  deadline TEXT,
  escalation_policy TEXT,
  status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
  decision_comment TEXT,
  decision_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  resolved_at TEXT,
  resolved_by TEXT
);

-- Agent messages table (inter-agent communication)
CREATE TABLE IF NOT EXISTS agent_messages (
  id TEXT PRIMARY KEY,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);

-- Agent access ports table (external URL access)
CREATE TABLE IF NOT EXISTS agent_ports (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  port_name TEXT NOT NULL,
  access_key TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  allowed_operations TEXT DEFAULT '["chat","run"]',
  rate_limit INTEGER DEFAULT 30,
  total_requests INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  last_accessed TEXT
);
