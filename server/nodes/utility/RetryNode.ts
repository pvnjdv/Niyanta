import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class RetryNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'RetryNode';
    this.name = 'RetryNode';
    this.type = 'RetryNode';
    this.category = 'utility' as typeof this.category;
    this.description = 'RetryNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
