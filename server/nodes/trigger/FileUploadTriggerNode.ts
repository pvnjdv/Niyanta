import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class FileUploadTriggerNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'FileUploadTriggerNode';
    this.name = 'File Upload';
    this.type = 'file_upload_trigger';
    this.category = 'trigger' as typeof this.category;
    this.description = 'Trigger workflow when a file is uploaded, with file metadata available in context';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const file = (config?.file as Record<string, unknown>) || {};
    return {
      ...context,
      workflowState: { ...context.workflowState, status: 'RUNNING' },
      metadata: { ...context.metadata, trigger: { type: 'file_upload', uploadedAt: new Date().toISOString() }, uploadedFile: { name: file.name || 'unknown', size: file.size || 0, mimeType: file.mimeType || 'application/octet-stream', path: file.path || '' } },
    };
  }
}
