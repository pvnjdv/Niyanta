import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class WebhookTriggerNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'WebhookTriggerNode';
    this.name = 'Webhook';
    this.type = 'webhook_trigger';
    this.category = 'trigger' as typeof this.category;
    this.description = 'Receive an HTTP webhook to trigger the workflow with payload data';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const payload = (config?.webhookPayload as Record<string, unknown>) || {};
    const secret = config?.secret as string | undefined;

    return {
      ...context,
      workflowState: { ...context.workflowState, status: 'RUNNING' },
      metadata: { ...context.metadata, trigger: { type: 'webhook', endpoint: config?.endpoint || '/webhook', method: config?.method || 'POST', payloadKeys: Object.keys(payload), receivedAt: new Date().toISOString(), secretConfigured: !!secret }, webhookPayload: payload },
    };
  }
}
