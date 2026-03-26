import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ClassificationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ClassificationNode';
    this.name = 'ClassificationNode';
    this.type = 'ClassificationNode';
    this.category = 'ai' as typeof this.category;
    this.description = 'ClassificationNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
