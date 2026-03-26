import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class TimerTriggerNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'TimerTriggerNode';
    this.name = 'TimerTriggerNode';
    this.type = 'TimerTriggerNode';
    this.category = 'trigger' as typeof this.category;
    this.description = 'TimerTriggerNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
