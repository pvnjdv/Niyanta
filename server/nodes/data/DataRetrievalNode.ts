import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';

export class DataRetrievalNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DataRetrievalNode';
    this.name = 'Read Data';
    this.type = 'data_retrieval';
    this.category = 'data' as typeof this.category;
    this.description = 'Retrieve data from database or workflow context by key or query';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const table = (config?.table as string) || 'workflow_data';
    const outputPath = (config?.outputPath as string) || 'context.queryResult';

    const stored = (context.metadata.stored as Record<string, unknown>) || {};
    const data = stored[table] || null;

    return {
      ...context,
      metadata: {
        ...context.metadata,
        retrieved: table,
        [outputPath.replace('context.', '')]: data,
        queryResult: data,
      },
    };
  }
}
