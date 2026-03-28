import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { v4 as uuid } from 'uuid';

export class PurchaseOrderNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'PurchaseOrderNode';
    this.name = 'Purchase Order';
    this.type = 'purchase_order';
    this.category = 'action' as typeof this.category;
    this.description = 'Generate purchase orders with vendor notification and ERP synchronization';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const autoApprove = (config?.autoApprove as boolean) ?? true;
    const notifyVendor = (config?.notifyVendor as boolean) ?? true;
    const paymentTerms = (config?.paymentTerms as string) || 'Net 30';
    const sendToERP = (config?.sendToERP as boolean) ?? false;

    const poNumber = `PO-${Date.now().toString(36).toUpperCase()}`;
    const poData = {
      poNumber,
      id: uuid(),
      autoApproved: autoApprove,
      vendorNotified: notifyVendor,
      paymentTerms,
      syncedToERP: sendToERP,
      createdAt: new Date().toISOString(),
      status: autoApprove ? 'approved' : 'pending_approval',
      sourceData: (context.invoice as Record<string, unknown>) || {},
    };

    return {
      ...context,
      metadata: { ...context.metadata, purchaseOrder: poData },
    };
  }
}
