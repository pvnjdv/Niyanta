import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class RuleEngineNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'RuleEngineNode';
    this.name = 'RuleEngineNode';
    this.type = 'RuleEngineNode';
    this.category = 'decision' as typeof this.category;
    this.description = 'RuleEngineNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
