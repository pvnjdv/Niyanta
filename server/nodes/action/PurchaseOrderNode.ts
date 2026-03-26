import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class PurchaseOrderNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'PurchaseOrderNode';
    this.name = 'PurchaseOrderNode';
    this.type = 'PurchaseOrderNode';
    this.category = 'action' as typeof this.category;
    this.description = 'PurchaseOrderNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
