import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ApprovalNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ApprovalNode';
    this.name = 'ApprovalNode';
    this.type = 'ApprovalNode';
    this.category = 'decision' as typeof this.category;
    this.description = 'ApprovalNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
