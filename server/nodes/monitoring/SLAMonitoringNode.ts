import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class SLAMonitoringNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'SLAMonitoringNode';
    this.name = 'SLA Monitoring';
    this.type = 'sla_monitoring';
    this.category = 'monitoring' as typeof this.category;
    this.description = 'Track SLA compliance, measure elapsed time against thresholds, and escalate on breach';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const slaThresholdMs = (config?.slaThresholdMs as number) || 3600000;
    const escalateTo = (config?.escalateTo as string) || '';
    const warningPercent = (config?.warningThreshold as number) ?? 80;

    const startTime = context.workflowState.startedAt;
    const elapsedMs = Date.now() - new Date(startTime).getTime();
    const percentUsed = (elapsedMs / slaThresholdMs) * 100;
    const status = elapsedMs > slaThresholdMs ? 'breached' : percentUsed >= warningPercent ? 'warning' : 'within';

    return {
      ...context,
      metadata: { ...context.metadata, slaMonitoring: { slaThresholdMs, elapsedMs, percentUsed: Math.round(percentUsed), status, escalateTo, checkedAt: new Date().toISOString() } },
    };
  }
}
