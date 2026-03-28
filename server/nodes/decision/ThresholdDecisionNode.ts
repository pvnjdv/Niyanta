import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ThresholdDecisionNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ThresholdDecisionNode';
    this.name = 'Threshold Decision';
    this.type = 'threshold_decision';
    this.category = 'decision' as typeof this.category;
    this.description = 'Compare a numeric value against a threshold and route to pass/fail branches';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const valueField = (config?.valueField as string) || 'amount';
    const threshold = (config?.threshold as number) ?? 5000;
    const operator = (config?.operator as string) || 'gte';

    const src: Record<string, unknown> = { ...context.metadata, ...context.invoice, ...context.finance };
    const rawValue = src[valueField];
    const value = Number(rawValue ?? 0);

    const ops: Record<string, boolean> = {
      gt: value > threshold, gte: value >= threshold,
      lt: value < threshold, lte: value <= threshold,
      eq: value === threshold, neq: value !== threshold,
    };
    const decision = ops[operator] ?? false;

    return {
      ...context,
      metadata: { ...context.metadata, thresholdDecision: decision ? 'pass' : 'fail', value, threshold, operator },
    };
  }
}
