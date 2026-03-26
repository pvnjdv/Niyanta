import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DecisionGenerationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DecisionGenerationNode';
    this.name = 'DecisionGenerationNode';
    this.type = 'DecisionGenerationNode';
    this.category = 'ai' as typeof this.category;
    this.description = 'DecisionGenerationNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
