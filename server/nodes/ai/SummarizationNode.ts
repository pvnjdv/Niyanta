import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class SummarizationNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'SummarizationNode';
    this.name = 'Summarization';
    this.type = 'summarization';
    this.category = 'ai' as typeof this.category;
    this.description = 'Generate concise AI summaries with key points and actionable insights';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const style = (config?.style as string) || 'Concise';
    const maxLength = (config?.maxLength as number) ?? 150;
    const inputPath = (config?.inputPath as string) || 'context.text';
    const outputPath = (config?.outputPath as string) || 'context.summary';

    const inputParts = inputPath.replace('context.', '').split('.');
    let inputData: unknown = { ...context.metadata, ...context.document };
    for (const part of inputParts) inputData = (inputData as Record<string, unknown>)?.[part];
    if (!inputData) inputData = JSON.stringify(context.metadata);

    try {
      const result = await callGroqJSON<Record<string, unknown>>(
        `Summarize in ${style} style, max ${maxLength} words. Return JSON: { summary: string, keyPoints: string[], implications: string[] }`,
        `Content to summarize: ${JSON.stringify(inputData)}`,
        'llama-3.3-70b-versatile'
      );
      return { ...context, metadata: { ...context.metadata, summary: result, [outputPath.replace('context.', '')]: result } };
    } catch {
      return { ...context, metadata: { ...context.metadata, summary: { summary: 'Workflow data summarized', keyPoints: [], implications: [] } } };
    }
  }
}
