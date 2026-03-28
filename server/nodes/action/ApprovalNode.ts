import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { getDB } from '../../db/database';
import { v4 as uuid } from 'uuid';

export class ApprovalNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ApprovalNode';
    this.name = 'Approval Request';
    this.type = 'approval';
    this.category = 'action' as typeof this.category;
    this.description = 'Request human approval before proceeding';
  }

  async execute(context: WorkflowContext, config?: any): Promise<WorkflowContext> {
    const db = getDB();
    
    // Extract config
    const {
      title = 'Approval Required',
      description = 'Please review and approve this request',
      assignedTo = 'admin',
      priority = 'medium',
      deadline,
      escalationPolicy,
      requireComment = false,
    } = config || {};

    // Get workflow info from context
    const workflowRunId = context.runId || 'unknown';
    const workflowId = context.workflowId || 'unknown';
    const workflowName = (context.metadata?.workflowName as string) || 'Unnamed Workflow';
    const nodeId = context.workflowState?.currentNodeId || 'unknown';
    const nodeName = config?.nodeName || 'Approval Node';

    // Create approval request
    const approvalId = uuid();
    const now = new Date().toISOString();
    
    // Calculate deadline if relative time provided (e.g., "24h", "3d")
    let deadlineDate = deadline;
    if (deadline && typeof deadline === 'string') {
      const match = deadline.match(/^(\d+)(h|d|m)$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        const date = new Date();
        
        if (unit === 'h') date.setHours(date.getHours() + value);
        else if (unit === 'd') date.setDate(date.getDate() + value);
        else if (unit === 'm') date.setMinutes(date.getMinutes() + value);
        
        deadlineDate = date.toISOString();
      }
    }

    try {
      db.prepare(`
        INSERT INTO pending_approvals (
          id, workflow_run_id, workflow_id, workflow_name, 
          node_id, node_name, title, description, context, 
          assigned_to, priority, deadline, escalation_policy, 
          status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(
        approvalId,
        workflowRunId,
        workflowId,
        workflowName,
        nodeId,
        nodeName,
        title,
        description,
        JSON.stringify({
          document: context.document,
          invoice: context.invoice,
          metadata: context.metadata,
          requireComment,
        }),
        assignedTo,
        priority,
        deadlineDate || null,
        escalationPolicy || null,
        now
      );

      // Update workflow run status to WAITING_APPROVAL
      db.prepare(`
        UPDATE workflow_runs 
        SET status = 'WAITING_APPROVAL' 
        WHERE id = ?
      `).run(workflowRunId);

      // Add to workflow logs
      context.logs.push({
        nodeId,
        nodeName,
        status: 'waiting',
        message: `Approval request created: ${title}`,
        timestamp: now,
      });

      // Store approval ID in metadata (extend context as needed)
      return {
        ...context,
        metadata: {
          ...context.metadata,
          approvalId,
          approvalStatus: 'PENDING',
        },
        workflowState: {
          ...context.workflowState,
          status: 'WAITING_APPROVAL' as const,
        },
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      context.logs.push({
        nodeId,
        nodeName,
        status: 'failed',
        message: `Failed to create approval request: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}
