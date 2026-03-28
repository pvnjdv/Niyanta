import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class InvoiceProcessingNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'InvoiceProcessingNode';
    this.name = 'Invoice Processor';
    this.type = 'invoice_processing';
    this.category = 'action' as typeof this.category;
    this.description = 'Process and extract invoice fields, validate amounts, and flag for approval';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const extractFields = (config?.extractFields as string[]) || ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax'];
    const validateAmount = (config?.validateAmount as boolean) ?? true;
    const requireApproval = (config?.requireApproval as number) ?? 5000;
    const maxAmount = (config?.maxAmount as number) ?? 0;

    const rawContent =
      (context.metadata as Record<string, unknown>).ocrOutput ||
      (context.document as Record<string, unknown>)?.content ||
      '';

    let extracted: Record<string, unknown> = {};

    if (rawContent) {
      try {
        extracted = await callGroqJSON<Record<string, unknown>>(
          'You are an invoice data extraction AI. Extract the specified fields from the invoice text. Return a flat JSON object.',
          `Extract: ${extractFields.join(', ')}\n\nContent:\n${rawContent}`,
          'llama-3.3-70b-versatile'
        );
      } catch {
        extracted = Object.fromEntries(extractFields.map((f) => [f.replace(/\s+/g, '_'), `[${f}]`]));
      }
    } else {
      extracted = Object.fromEntries(extractFields.map((f) => [f.replace(/\s+/g, '_'), `[${f}]`]));
    }

    const amount = Number(
      extracted.Amount || extracted.Total_Amount || (context.invoice as Record<string, unknown>)?.amount || 0
    );
    const needsApproval = validateAmount && amount >= requireApproval;
    const exceedsMax = maxAmount > 0 && amount > maxAmount;

    return {
      ...context,
      invoice: { ...context.invoice, processed: true, processedAt: new Date().toISOString(), extractedFields: extracted, amount, needsApproval },
      metadata: { ...context.metadata, invoiceProcessing: { extracted, amount, needsApproval, exceedsMax, processedAt: new Date().toISOString() } },
    };
  }
}
