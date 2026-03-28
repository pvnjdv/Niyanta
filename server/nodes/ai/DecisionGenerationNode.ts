import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class DecisionGenerationNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'DecisionGenerationNode';
    this.name = 'Decision Generation';
    this.type = 'decision_generation';
    this.category = 'ai' as typeof this.category;
    this.description = 'AI-powered multi-criteria decision analysis with option scoring';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const criteria = (config?.criteria as string) || 'best overall outcome';
    const options = (config?.options as string[]) || [];
    const model = (config?.model as string) || 'llama-3.3-70b-versatile';

    try {
      const result = await callGroqJSON<Record<string, unknown>>(
        'You are an enterprise decision advisor. Return JSON: { recommendation: string, confidence: number, reasoning: string, optionScores: [{option,score,pros,cons}], criteria: string }',
        `Criteria: ${criteria}\nOptions: ${JSON.stringify(options)}\nContext: ${JSON.stringify({ metadata: context.metadata })}`,
        model as 'llama-3.3-70b-versatile'
      );
      return { ...context, metadata: { ...context.metadata, decisionGeneration: result } };
    } catch {
      return { ...context, metadata: { ...context.metadata, decisionGeneration: { recommendation: options[0] || 'proceed', confidence: 0.7, reasoning: 'Simulated', optionScores: [], criteria } } };
    }
  }
}
