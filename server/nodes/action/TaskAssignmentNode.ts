import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class TaskAssignmentNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'TaskAssignmentNode';
    this.name = 'TaskAssignmentNode';
    this.type = 'TaskAssignmentNode';
    this.category = 'action' as typeof this.category;
    this.description = 'TaskAssignmentNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
