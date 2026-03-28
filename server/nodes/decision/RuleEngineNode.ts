import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class RuleEngineNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'RuleEngineNode';
    this.name = 'Rule Engine';
    this.type = 'rule_engine';
    this.category = 'decision' as typeof this.category;
    this.description = 'Evaluate a set of business rules against workflow context and produce structured pass/fail results';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const rules = (config?.rules as string[]) || [];
    const failOnFirst = (config?.failOnFirst as boolean) ?? false;

    const src: Record<string, unknown> = { ...context.metadata, ...context.invoice, ...context.document, ...context.employee };
    const results = rules.map((rule) => {
      try {
        const [lhs, op, rhs] = rule.split(/\s+(eq|neq|gt|lt|gte|lte|contains)\s+/);
        const fieldVal = src[lhs?.trim()];
        const passed = this.eval(fieldVal, op, rhs?.trim());
        return { rule, passed, reason: passed ? 'OK' : `${lhs} ${op} ${rhs} failed` };
      } catch {
        return { rule, passed: true, reason: 'Skipped (parse error)' };
      }
    });

    const allPassed = results.every((r) => r.passed);
    const firstFail = results.find((r) => !r.passed);

    return {
      ...context,
      metadata: { ...context.metadata, ruleEngineResult: { results, allPassed, firstFail: firstFail || null, evaluatedAt: new Date().toISOString() } },
    };
  }

  private eval(a: unknown, op: string, b: string): boolean {
    const num = Number(a);
    const numB = Number(b);
    switch (op) {
      case 'eq': return String(a) === b;
      case 'neq': return String(a) !== b;
      case 'gt': return num > numB;
      case 'lt': return num < numB;
      case 'gte': return num >= numB;
      case 'lte': return num <= numB;
      case 'contains': return typeof a === 'string' && a.includes(b);
      default: return true;
    }
  }
}
