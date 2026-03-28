import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class LLMAnalysisNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'LLMAnalysisNode';
    this.name = 'LLM Reasoning';
    this.type = 'llm_analysis';
    this.category = 'ai' as typeof this.category;
    this.description = 'Run AI-powered analysis on workflow context using Groq LLM';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const prompt = (config?.prompt as string) || 'Analyze the provided context and return insights';
    const model = (config?.model as string) || 'llama-3.3-70b-versatile';
    const temperature = (config?.temperature as number) ?? 0.7;
    const maxTokens = (config?.maxTokens as number) ?? 2000;
    const inputPath = (config?.inputPath as string) || 'context.data';
    const outputPath = (config?.outputPath as string) || 'context.llmResult';

    const contextSnippet = JSON.stringify(
      { document: context.document, invoice: context.invoice, employee: context.employee, metadata: context.metadata },
      null,
      2
    );

    try {
      const result = await callGroqJSON<Record<string, unknown>>(
        `You are an enterprise AI analyst. Return a JSON object with: analysis (string), confidence (0-1), recommendations (array of strings), keyFindings (array of strings).`,
        `Task: ${prompt}\n\nContext (inputPath: ${inputPath}):\n${contextSnippet}`,
        model as 'llama-3.3-70b-versatile'
      );
      return {
        ...context,
        metadata: { ...context.metadata, llmAnalysis: result, [outputPath.replace('context.', '')]: result },
      };
    } catch {
      return {
        ...context,
        metadata: {
          ...context.metadata,
          llmAnalysis: { analysis: 'LLM analysis simulated', confidence: 0.8, recommendations: [], keyFindings: [] },
        },
      };
    }
  }
}
