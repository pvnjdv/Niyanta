import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DataRetrievalNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DataRetrievalNode';
    this.name = 'DataRetrievalNode';
    this.type = 'DataRetrievalNode';
    this.category = 'data' as typeof this.category;
    this.description = 'DataRetrievalNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
