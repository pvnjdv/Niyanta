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
    this.name = 'ReportGenerationNode';
    this.type = 'ReportGenerationNode';
    this.category = 'action' as typeof this.category;
    this.description = 'ReportGenerationNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
