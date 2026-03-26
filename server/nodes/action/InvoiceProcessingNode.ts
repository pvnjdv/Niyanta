import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class InvoiceProcessingNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'InvoiceProcessingNode';
    this.name = 'InvoiceProcessingNode';
    this.type = 'InvoiceProcessingNode';
    this.category = 'action' as typeof this.category;
    this.description = 'InvoiceProcessingNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
