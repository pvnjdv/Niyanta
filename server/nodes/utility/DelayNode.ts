import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DelayNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DelayNode';
    this.name = 'DelayNode';
    this.type = 'DelayNode';
    this.category = 'utility' as typeof this.category;
    this.description = 'DelayNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
