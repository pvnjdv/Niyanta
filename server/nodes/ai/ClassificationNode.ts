import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class ClassificationNode implements INode {
  id: string;
  name: string;
  type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'ClassificationNode';
    this.name = 'Classification';
    this.type = 'classification';
    this.category = 'ai' as typeof this.category;
    this.description = 'Classify content into categories using AI with confidence scoring';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const categories = (config?.categories as string) || 'high, medium, low';
    const model = (config?.model as string) || 'llama-3.3-70b-versatile';
    const confidenceThreshold = (config?.confidenceThreshold as number) ?? 0.7;
    const inputPath = (config?.inputPath as string) || 'context.data';
    const outputPath = (config?.outputPath as string) || 'context.classification';
    const returnConfidence = (config?.returnConfidence as boolean) ?? true;

    const catList = categories.split(',').map((c: string) => c.trim());
    const inputParts = inputPath.replace('context.', '').split('.');
    let inputData: unknown = { ...context.metadata, ...context.document, ...context.invoice };
    for (const part of inputParts) inputData = (inputData as Record<string, unknown>)?.[part];

    try {
      const result = await callGroqJSON<Record<string, unknown>>(
        `Classify the input into exactly one of these categories: ${catList.join(', ')}. Return JSON: { classification: string, confidence: number (0-1), reasoning: string }`,
        `Classify: ${JSON.stringify(inputData)}`,
        model as 'llama-3.3-70b-versatile'
      );
      const classification = result;
      return {
        ...context,
        metadata: {
          ...context.metadata,
          classification,
          [outputPath.replace('context.', '')]: classification,
        },
      };
    } catch {
      const fallback = { classification: catList[0], confidence: 0.5, reasoning: 'Simulated classification' };
      return {
        ...context,
        metadata: { ...context.metadata, classification: fallback },
      };
    }
  }
}
