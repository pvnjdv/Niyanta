import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class MeetingTranscriptTriggerNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'MeetingTranscriptTriggerNode';
    this.name = 'Meeting Transcript';
    this.type = 'meeting_transcript_trigger';
    this.category = 'trigger' as typeof this.category;
    this.description = 'Trigger workflow when a meeting transcript is available for processing';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const transcript = (config?.transcript as string) || '';
    const meetingTitle = (config?.meetingTitle as string) || 'Untitled Meeting';
    const participants = (config?.participants as string[]) || [];

    return {
      ...context,
      workflowState: { ...context.workflowState, status: 'RUNNING' },
      metadata: { ...context.metadata, trigger: { type: 'meeting_transcript', triggeredAt: new Date().toISOString() }, meetingTranscript: { title: meetingTitle, participants, transcriptLength: transcript.length, transcript } },
    };
  }
}
