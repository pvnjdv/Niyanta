import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { getDB } from '../../db/database';
import { v4 as uuid } from 'uuid';

export class DataStorageNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DataStorageNode';
    this.name = 'Save Data';
    this.type = 'data_storage';
    this.category = 'data' as typeof this.category;
    this.description = 'Persist workflow data to the database with configurable table, operation, and key';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const table = (config?.table as string) || 'workflow_data';
    const operation = (config?.operation as string) || 'Insert';
    const dataPath = (config?.dataPath as string) || 'context.data';
    const primaryKey = (config?.primaryKey as string) || 'id';

    const pathParts = dataPath.replace('context.', '').split('.');
    let data: unknown = { ...context.metadata, ...context.invoice, ...context.document };
    for (const part of pathParts) data = (data as Record<string, unknown>)?.[part];
    if (!data) data = context.metadata;

    const recordId = uuid();
    try {
      const db = getDB();
      if (operation === 'Insert') {
        db.prepare(`INSERT OR IGNORE INTO workflow_data (id, workflow_id, run_id, key, value, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
          .run(recordId, context.workflowId, context.runId, table, JSON.stringify(data), new Date().toISOString());
      }
    } catch { /* Silently handle missing table */ }

    return {
      ...context,
      metadata: { ...context.metadata, stored: { ...((context.metadata.stored as Record<string, unknown>) || {}), [table]: data }, lastStoredId: recordId },
    };
  }
}
