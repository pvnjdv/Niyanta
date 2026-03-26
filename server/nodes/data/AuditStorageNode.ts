import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class AuditStorageNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'AuditStorageNode';
    this.name = 'AuditStorageNode';
    this.type = 'AuditStorageNode';
    this.category = 'data' as typeof this.category;
    this.description = 'AuditStorageNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
