import { INode } from '../../types/node.types';
import { WorkflowContext } from '../../types/workflow.types';
import { callGroqJSON } from '../../utils/groqClient';

export class RiskAnalysisNode implements INode {
  id: string; name: string; type: string;
  category: 'trigger' | 'data' | 'document' | 'processing' | 'ai' | 'decision' | 'action' | 'monitoring' | 'audit' | 'utility' | 'integration';
  description: string;

  constructor() {
    this.id = 'RiskAnalysisNode';
    this.name = 'Risk Analysis';
    this.type = 'risk_analysis';
    this.category = 'ai' as typeof this.category;
    this.description = 'AI risk assessment with severity scoring, mitigation strategies, and domain-specific analysis';
  }

  async execute(context: WorkflowContext, config?: Record<string, unknown>): Promise<WorkflowContext> {
    const factors = (config?.factors as string) || 'general';
    const threshold = (config?.threshold as number) ?? 0.7;
    const outputPath = (config?.outputPath as string) || 'context.riskScore';
    const model = 'llama-3.3-70b-versatile';

    const contextStr = JSON.stringify({ document: context.document, invoice: context.invoice, employee: context.employee, metadata: context.metadata }, null, 2);

    try {
      const result = await callGroqJSON<Record<string, unknown>>(
        `You are an enterprise risk analyst. Analyze risks for factors: ${factors}. Return JSON: { riskLevel: "critical"|"high"|"medium"|"low", risks: [{description, severity, likelihood, impact}], mitigations: string[], overallScore: number (0-100), aboveThreshold: boolean }`,
        `Risk factors: ${factors}\nThreshold: ${threshold}\nContext:\n${contextStr}`,
        model
      );
      const riskResult = { ...result, threshold, aboveThreshold: Number(result.overallScore || 0) / 100 >= threshold };
      return { ...context, metadata: { ...context.metadata, riskAnalysis: riskResult, [outputPath.replace('context.', '')]: riskResult } };
    } catch {
      const fallback = { riskLevel: 'medium', risks: [], mitigations: [], overallScore: 40, threshold, aboveThreshold: false };
      return { ...context, metadata: { ...context.metadata, riskAnalysis: fallback } };
    }
  }
}
