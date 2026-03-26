import { BaseGroqAgent } from './BaseGroqAgent';

export class HROperationsAgent extends BaseGroqAgent {
  readonly id = 'hr';
  readonly systemPrompt = `You are the HR Operations Agent inside Niyanta AI.
Create comprehensive onboarding plans with least privilege system access.
Return strict JSON with employee, checklist (preboarding/day_one/week_one/month_one), documents_needed, system_access, audit.`;
}
