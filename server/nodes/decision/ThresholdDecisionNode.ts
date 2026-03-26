import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ThresholdDecisionNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ThresholdDecisionNode';
    this.name = 'ThresholdDecisionNode';
    this.type = 'ThresholdDecisionNode';
    this.category = 'decision' as typeof this.category;
    this.description = 'ThresholdDecisionNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
