import { NodeDefinition } from '../types/node.types';

export class NodeRegistry {
  private definitions: Map<string, NodeDefinition>;

  constructor() {
    this.definitions = new Map();
    this.bootstrap();
  }

  register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  all(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  get(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  private bootstrap(): void {
    const nodes: NodeDefinition[] = [
      {
        type: 'manual_trigger',
        name: 'Manual Trigger',
        category: 'trigger',
        description: 'Start workflow manually from UI/API.',
        configSchema: { fields: [] },
      },
      {
        type: 'llm_analysis',
        name: 'LLM Analysis',
        category: 'ai',
        description: 'Run LLM analysis on context payload.',
        configSchema: {
          fields: [
            { key: 'prompt', label: 'Prompt', type: 'textarea', required: true },
            { key: 'model', label: 'Model', type: 'text', required: false },
          ],
        },
      },
      {
        type: 'approval',
        name: 'Approval',
        category: 'decision',
        description: 'Pause execution until approver decision.',
        configSchema: {
          fields: [{ key: 'approver', label: 'Approver', type: 'text', required: true }],
        },
      },
      {
        type: 'notification',
        name: 'Notification',
        category: 'action',
        description: 'Send summary notification to stakeholders.',
        configSchema: {
          fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['email', 'slack', 'webhook'] }],
        },
      },
    ];

    nodes.forEach((n) => this.register(n));
  }
}
