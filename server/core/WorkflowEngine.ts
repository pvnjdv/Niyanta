import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';
import { WorkflowContext, WorkflowDefinition } from '../types/workflow.types';

export class WorkflowEngine {
  createRun(workflowId: string, triggeredBy: string = 'manual'): string {
    const id = uuid();
    const db = getDB();
    db.prepare(
      `INSERT INTO workflow_runs (id, workflow_id, status, context, started_at, triggered_by)
       VALUES (?, ?, 'PENDING', ?, ?, ?)`
    ).run(id, workflowId, JSON.stringify({}), new Date().toISOString(), triggeredBy);
    return id;
  }

  getWorkflow(workflowId: string): WorkflowDefinition | null {
    const db = getDB();
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as
      | (Record<string, unknown> & { id: string; name: string; description: string; nodes: string; edges: string; status: 'draft' | 'active' | 'disabled'; category: string })
      | undefined;

    if (!row) return null;

    return {
      workflowId: row.id,
      name: row.name,
      description: row.description,
      nodes: JSON.parse(row.nodes),
      edges: JSON.parse(row.edges),
      status: row.status,
      category: row.category,
    };
  }

  buildInitialContext(workflowId: string, runId: string): WorkflowContext {
    return {
      workflowId,
      runId,
      document: {},
      invoice: {},
      employee: {},
      procurement: {},
      finance: {},
      task: {},
      metadata: {},
      workflowState: {
        retries: {},
        startedAt: new Date().toISOString(),
        status: 'PENDING',
      },
      logs: [],
    };
  }
}
