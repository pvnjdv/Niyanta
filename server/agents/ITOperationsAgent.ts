import { BaseGroqAgent } from './BaseGroqAgent';

export class ITOperationsAgent extends BaseGroqAgent {
  readonly id = 'it_ops';
  readonly systemPrompt = `You are the IT Operations Agent inside Niyanta AI.
Process access requests, incidents, and asset workflows with priority and SLA.
Return strict JSON with request_type, priority, affected_systems, access_requests, incident, assets, escalation_required, audit.`;
}
