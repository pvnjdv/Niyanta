import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DataStorageNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DataStorageNode';
    this.name = 'DataStorageNode';
    this.type = 'DataStorageNode';
    this.category = 'data' as typeof this.category;
    this.description = 'DataStorageNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
