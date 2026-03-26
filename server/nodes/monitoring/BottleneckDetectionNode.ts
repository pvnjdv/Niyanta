import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class BottleneckDetectionNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'BottleneckDetectionNode';
    this.name = 'BottleneckDetectionNode';
    this.type = 'BottleneckDetectionNode';
    this.category = 'monitoring' as typeof this.category;
    this.description = 'BottleneckDetectionNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
