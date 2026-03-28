import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class BottleneckDetectionNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'BottleneckDetectionNode';
    this.name = 'Bottleneck Detector';
    this.type = 'bottleneck_detection';
    this.category = 'monitoring' as typeof this.category;
    this.description = 'Identify the slowest nodes in workflow execution and surface performance bottlenecks';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const topN = (config?.topN as number) || 3;
    const logs = context.logs || [];

    const nodeTimes: Record<string, number[]> = {};
    for (let i = 0; i < logs.length - 1; i++) {
      const cur = logs[i];
      const next = logs[i + 1];
      const dur = new Date(next.timestamp).getTime() - new Date(cur.timestamp).getTime();
      if (!nodeTimes[cur.nodeName]) nodeTimes[cur.nodeName] = [];
      nodeTimes[cur.nodeName].push(dur);
    }

    const bottlenecks = Object.entries(nodeTimes)
      .map(([nodeName, times]) => ({ nodeName, avgMs: Math.round(times.reduce((a, b) => a + b, 0) / times.length), maxMs: Math.max(...times) }))
      .sort((a, b) => b.avgMs - a.avgMs)
      .slice(0, topN);

    return {
      ...context,
      metadata: { ...context.metadata, bottlenecks, bottleneckDetectedAt: new Date().toISOString() },
    };
  }
}
