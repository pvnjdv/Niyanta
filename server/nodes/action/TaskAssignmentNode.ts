import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { v4 as uuid } from 'uuid';

export class TaskAssignmentNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'TaskAssignmentNode';
    this.name = 'Task Assignment';
    this.type = 'task_assignment';
    this.category = 'action' as typeof this.category;
    this.description = 'Assign tasks to team members with priority, due date, and workflow context';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const title = (config?.title as string) || 'Assigned Task';
    const description = (config?.description as string) || '';
    const assignTo = (config?.assignTo as string) || 'admin';
    const priority = (config?.priority as string) || 'Normal';
    const dueDate = (config?.dueDate as string) || '';

    let dueDateResolved = dueDate;
    if (dueDate) {
      const raw = dueDate.replace('now + ', '').trim();
      const match = raw.match(/^([+-]?\d+)(d|h|m|w)$/);
      if (match) {
        const val = parseInt(match[1]);
        const unit = match[2];
        const date = new Date();
        if (unit === 'h') date.setHours(date.getHours() + val);
        else if (unit === 'd') date.setDate(date.getDate() + val);
        else if (unit === 'm') date.setMinutes(date.getMinutes() + val);
        else if (unit === 'w') date.setDate(date.getDate() + val * 7);
        dueDateResolved = date.toISOString();
      }
    }

    const task = {
      id: uuid(),
      title,
      description,
      assignedTo: assignTo,
      priority,
      dueDate: dueDateResolved || null,
      status: 'open',
      createdAt: new Date().toISOString(),
      workflowId: context.workflowId,
      runId: context.runId,
    };

    return {
      ...context,
      task: { ...context.task, ...task },
      metadata: { ...context.metadata, lastAssignedTask: task },
    };
  }
}
