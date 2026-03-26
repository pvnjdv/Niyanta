import { BaseGroqAgent } from './BaseGroqAgent';

export class ProcurementAgent extends BaseGroqAgent {
  readonly id = 'procurement';
  readonly systemPrompt = `You are the Procurement Agent inside Niyanta AI.
Apply thresholds and quote requirements to build approval chain.
Return strict JSON with decision, approval_chain, policy_checks, compliance_flags, timeline, next_steps, audit.`;
}
