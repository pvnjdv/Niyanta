import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class ReportGenerationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ReportGenerationNode';
    this.name = 'PDF Report';
    this.type = 'report_generation';
    this.category = 'action' as typeof this.category;
    this.description = 'Generate formatted PDF, CSV, or Excel reports from workflow context data';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const template = (config?.template as string) || 'default';
    const outputPath = (config?.outputPath as string) || 'context.reportFile';
    const includeCharts = (config?.includeCharts as boolean) ?? false;

    const reportFile = {
      type: template,
      fileId: `report_${Date.now()}.pdf`,
      outputPath,
      includeCharts,
      generatedAt: new Date().toISOString(),
      workflowId: context.workflowId,
      runId: context.runId,
    };

    return {
      ...context,
      metadata: { ...context.metadata, reportGenerated: reportFile, reportFile },
    };
  }
}
