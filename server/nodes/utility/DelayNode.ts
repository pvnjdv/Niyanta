import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DelayNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DelayNode';
    this.name = 'Delay';
    this.type = 'delay';
    this.category = 'utility' as typeof this.category;
    this.description = 'Pause workflow execution for a specified duration';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const delayMs = (config?.delayMs as number) || 1000;
    const maxDelay = 30000; // cap at 30s in execution context
    const actualDelay = Math.min(delayMs, maxDelay);
    await new Promise((resolve) => setTimeout(resolve, actualDelay));
    return {
      ...context,
      metadata: { ...context.metadata, delay: { requestedMs: delayMs, actualMs: actualDelay, resumedAt: new Date().toISOString() } },
    };
  }
}
