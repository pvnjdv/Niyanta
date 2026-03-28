import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class TimerTriggerNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'TimerTriggerNode';
    this.name = 'Schedule';
    this.type = 'timer_trigger';
    this.category = 'trigger' as typeof this.category;
    this.description = 'Trigger workflow on a recurring schedule using cron expressions';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    return {
      ...context,
      workflowState: { ...context.workflowState, status: 'RUNNING' },
      metadata: { ...context.metadata, trigger: { type: 'timer', cron: config?.cron || '0 9 * * *', timezone: config?.timezone || 'UTC', triggeredAt: new Date().toISOString() } },
    };
  }
}
