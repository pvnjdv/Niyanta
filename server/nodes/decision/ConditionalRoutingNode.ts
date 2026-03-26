import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ConditionalRoutingNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ConditionalRoutingNode';
    this.name = 'ConditionalRoutingNode';
    this.type = 'ConditionalRoutingNode';
    this.category = 'decision' as typeof this.category;
    this.description = 'ConditionalRoutingNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
