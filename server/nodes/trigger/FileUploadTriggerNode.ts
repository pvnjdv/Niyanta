import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class FileUploadTriggerNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'FileUploadTriggerNode';
    this.name = 'FileUploadTriggerNode';
    this.type = 'FileUploadTriggerNode';
    this.category = 'trigger' as typeof this.category;
    this.description = 'FileUploadTriggerNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
