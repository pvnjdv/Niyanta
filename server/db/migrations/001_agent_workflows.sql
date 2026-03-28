-- Agent Workflows Junction Table
-- Links agents to workflows they can trigger/manage

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
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_workflows_agent ON agent_workflows(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_workflows_workflow ON agent_workflows(workflow_id);
