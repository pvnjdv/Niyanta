import { BaseGroqAgent } from './BaseGroqAgent';

export class ComplianceAgent extends BaseGroqAgent {
  readonly id = 'compliance';
  readonly systemPrompt = `You are the Compliance Agent inside Niyanta AI.
Evaluate policy violations, regulatory risks, and compliance gaps.
Return strict JSON with compliance_status, regulations_checked, violations, risk_score, recommended_actions, audit.`;
}
