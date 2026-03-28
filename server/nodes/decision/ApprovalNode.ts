import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DecisionApprovalNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DecisionApprovalNode';
    this.name = 'Decision Approval';
    this.type = 'decision_approval';
    this.category = 'decision' as typeof this.category;
    this.description = 'Auto-approve or require human approval based on configurable criteria and thresholds';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const autoApproveBelow = (config?.autoApproveBelow as number) ?? 0;
    const approver = (config?.approver as string) || 'admin';
    const amount = Number((context.invoice as Record<string, unknown>)?.amount ?? 0);

    const autoApproved = autoApproveBelow > 0 && amount < autoApproveBelow;

    return {
      ...context,
      metadata: {
        ...context.metadata,
        approvalDecision: autoApproved ? 'auto_approved' : 'pending',
        approvedBy: autoApproved ? 'system' : approver,
        approvedAt: autoApproved ? new Date().toISOString() : null,
      },
    };
  }
}
