import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ConditionalRoutingNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ConditionalRoutingNode';
    this.name = 'If/Else';
    this.type = 'conditional_routing';
    this.category = 'decision' as typeof this.category;
    this.description = 'Route workflow execution based on field comparisons with support for eq, gt, lt, contains, and more';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const field = (config?.condition as string) || '';
    const operator = (config?.operator as string) || 'equals';
    const value = config?.value;

    const src: Record<string, unknown> = { ...context.metadata, ...context.invoice, ...context.document, ...context.employee };
    const fieldValue = src[field] ?? context.workflowState?.[field as keyof typeof context.workflowState];

    const conditionMet = this.compare(fieldValue, operator, value);

    return {
      ...context,
      metadata: { ...context.metadata, routingDecision: conditionMet ? 'true' : 'false', condition: field, conditionMet },
    };
  }

  private compare(a: unknown, op: string, b: unknown): boolean {
    switch (op) {
      case 'equals': case 'eq': case '==': return a === b;
      case 'not equals': case 'neq': case '!=': return a !== b;
      case 'greater than': case 'gt': case '>': return Number(a) > Number(b);
      case 'less than': case 'lt': case '<': return Number(a) < Number(b);
      case 'greater than or equal': case 'gte': case '>=': return Number(a) >= Number(b);
      case 'less than or equal': case 'lte': case '<=': return Number(a) <= Number(b);
      case 'contains': return typeof a === 'string' && typeof b === 'string' && a.includes(b);
      case 'regex': try { return typeof a === 'string' && new RegExp(String(b)).test(a); } catch { return false; }
      default: return Boolean(a);
    }
  }
}
