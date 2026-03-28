import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class RetryNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'RetryNode';
    this.name = 'Retry';
    this.type = 'retry';
    this.category = 'utility' as typeof this.category;
    this.description = 'Retry a previous step on failure with configurable backoff strategy';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const maxRetries = (config?.maxRetries as number) || 3;
    const backoffMs = (config?.backoffMs as number) || 1000;
    const targetNode = (config?.targetNode as string) || '';

    const currentAttempt = ((context.metadata.retryAttempts as Record<string, number>)?.[targetNode] || 0) + 1;
    const retryAttempts = { ...((context.metadata.retryAttempts as Record<string, number>) || {}), [targetNode]: currentAttempt };

    const shouldRetry = currentAttempt <= maxRetries;
    if (shouldRetry && backoffMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(backoffMs * currentAttempt, 10000)));
    }

    return {
      ...context,
      metadata: { ...context.metadata, retryAttempts, retryStatus: { targetNode, currentAttempt, maxRetries, shouldRetry, retriedAt: new Date().toISOString() } },
    };
  }
}
