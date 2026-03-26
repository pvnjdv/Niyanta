import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class LLMAnalysisNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'LLMAnalysisNode';
    this.name = 'LLMAnalysisNode';
    this.type = 'LLMAnalysisNode';
    this.category = 'ai' as typeof this.category;
    this.description = 'LLMAnalysisNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
