import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class SummarizationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'SummarizationNode';
    this.name = 'SummarizationNode';
    this.type = 'SummarizationNode';
    this.category = 'ai' as typeof this.category;
    this.description = 'SummarizationNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
