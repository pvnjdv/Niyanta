import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class NotificationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'NotificationNode';
    this.name = 'NotificationNode';
    this.type = 'NotificationNode';
    this.category = 'action' as typeof this.category;
    this.description = 'NotificationNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
