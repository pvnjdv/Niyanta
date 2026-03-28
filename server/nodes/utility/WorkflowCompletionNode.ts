import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { getDB } from '../../db/database';

export class WorkflowCompletionNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'WorkflowCompletionNode';
    this.name = 'Workflow Complete';
    this.type = 'workflow_completion';
    this.category = 'utility' as typeof this.category;
    this.description = 'Finalize workflow, record completion, and emit result summary';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const completionStatus = (config?.status as string) || 'COMPLETED';
    const summary = (config?.summary as string) || 'Workflow completed successfully';

    try {
      const db = getDB();
      db.prepare(`UPDATE workflow_runs SET status = ?, completed_at = ?, result = ? WHERE id = ?`)
        .run(completionStatus, new Date().toISOString(), JSON.stringify({ summary, metadata: context.metadata }), context.runId);
    } catch (_err) {
      // best-effort DB update — workflow still completes
    }

    return {
      ...context,
      workflowState: { ...context.workflowState, status: completionStatus as typeof context.workflowState.status },
      metadata: { ...context.metadata, completion: { status: completionStatus, summary, completedAt: new Date().toISOString() } },
    };
  }
}
