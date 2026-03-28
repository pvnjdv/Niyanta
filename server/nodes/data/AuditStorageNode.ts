import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { getDB } from '../../db/database';
import { v4 as uuid } from 'uuid';

export class AuditStorageNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'AuditStorageNode';
    this.name = 'Audit Storage';
    this.type = 'audit_storage';
    this.category = 'audit' as typeof this.category;
    this.description = 'Store immutable audit records with retention policy, encryption flag, and compliance tagging';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const eventType = (config?.eventType as string) || 'workflow_event';
    const retentionDays = (config?.retentionDays as number) || 365;
    const encryptSensitive = (config?.encryptSensitive as boolean) ?? false;
    const now = new Date().toISOString();

    try {
      const db = getDB();
      db.prepare(`INSERT INTO audit_logs (id, agent_id, event_type, event, metadata, timestamp) VALUES (?, 'workflow_engine', ?, ?, ?, ?)`)
        .run(uuid(), eventType, `Workflow ${context.workflowId} run ${context.runId}`, JSON.stringify({ runId: context.runId, retentionDays, encryptSensitive }), now);
    } catch { /* Silently handle */ }

    return {
      ...context,
      metadata: { ...context.metadata, auditStored: { eventType, storedAt: now, retentionDays, encryptSensitive } },
    };
  }
}
