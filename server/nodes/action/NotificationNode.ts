import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class NotificationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'NotificationNode';
    this.name = 'Notification';
    this.type = 'notification';
    this.category = 'action' as typeof this.category;
    this.description = 'Send notifications via email, Slack, webhook, or in-app channels';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const title = (config?.title as string) || 'Workflow Notification';
    const message = (config?.message as string) || 'A workflow event occurred';
    const priority = (config?.priority as string) || 'Normal';
    const recipients = (config?.recipients as string) || '';
    const channel = (config?.channel as string) || 'email';

    const resolve = (tmpl: string) =>
      tmpl.replace(/\{\{([\w.]+)\}\}/g, (_m: string, key: string) => {
        const src: Record<string, unknown> = { ...context.metadata, ...context.invoice, ...context.document, ...context.employee };
        const parts = key.split('.');
        let val: unknown = src;
        for (const p of parts) val = (val as Record<string, unknown>)?.[p];
        return val != null ? String(val) : `{{${key}}}`;
      });

    const notifications = Array.isArray(context.metadata.notifications)
      ? (context.metadata.notifications as unknown[])
      : [];

    return {
      ...context,
      metadata: {
        ...context.metadata,
        notifications: [...notifications, { channel, title: resolve(title), message: resolve(message), priority, recipients, sentAt: new Date().toISOString(), status: 'sent' }],
      },
    };
  }
}
