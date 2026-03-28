import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ManualTriggerNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ManualTriggerNode';
    this.name = 'Manual Trigger';
    this.type = 'manual_trigger';
    this.category = 'trigger' as typeof this.category;
    this.description = 'Start a workflow manually with optional input data';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    return {
      ...context,
      workflowState: { ...context.workflowState, status: 'RUNNING' },
      metadata: { ...context.metadata, trigger: { type: 'manual', triggeredAt: new Date().toISOString(), triggeredBy: (config?.triggeredBy as string) || 'user', inputData: config?.inputData || {} } },
    };
  }
}
