import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class MeetingTranscriptTriggerNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'MeetingTranscriptTriggerNode';
    this.name = 'MeetingTranscriptTriggerNode';
    this.type = 'MeetingTranscriptTriggerNode';
    this.category = 'trigger' as typeof this.category;
    this.description = 'MeetingTranscriptTriggerNode node';
  }

  async execute(context: WorkflowContext): Promise<WorkflowContext> {
    return context;
  }
}
