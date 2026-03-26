import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class WorkflowCompletionNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'WorkflowCompletionNode';
    this.name = 'WorkflowCompletionNode';
    this.type = 'WorkflowCompletionNode';
    this.category = 'utility' as typeof this.category;
    this.description = 'WorkflowCompletionNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
