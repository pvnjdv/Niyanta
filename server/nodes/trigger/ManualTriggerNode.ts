import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ManualTriggerNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ManualTriggerNode';
    this.name = 'ManualTriggerNode';
    this.type = 'ManualTriggerNode';
    this.category = 'trigger' as typeof this.category;
    this.description = 'ManualTriggerNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
