import { BaseGroqAgent } from './BaseGroqAgent';

export class WorkflowIntelligenceAgent extends BaseGroqAgent {
  readonly id = 'workflow';
  readonly systemPrompt = `You are the Workflow Intelligence Agent inside Niyanta AI.
Analyze workflow data and suggest optimization and routing improvements.
Return strict JSON with workflow_analysis, optimization_suggestions, routing_recommendations, risk_assessment, audit.`;
}
