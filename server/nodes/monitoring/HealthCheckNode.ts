import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class HealthCheckNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'HealthCheckNode';
    this.name = 'HealthCheckNode';
    this.type = 'HealthCheckNode';
    this.category = 'monitoring' as typeof this.category;
    this.description = 'HealthCheckNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
