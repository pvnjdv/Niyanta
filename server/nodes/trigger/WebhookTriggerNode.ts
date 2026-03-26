import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class WebhookTriggerNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'WebhookTriggerNode';
    this.name = 'WebhookTriggerNode';
    this.type = 'WebhookTriggerNode';
    this.category = 'trigger' as typeof this.category;
    this.description = 'WebhookTriggerNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
