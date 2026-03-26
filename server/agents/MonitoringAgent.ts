import { BaseGroqAgent } from './BaseGroqAgent';

export class MonitoringAgent extends BaseGroqAgent {
  readonly id = 'monitoring';
  readonly systemPrompt = `You are the Monitoring Agent inside Niyanta AI.
Analyze operational metrics for SLA breaches and bottlenecks.
Return strict JSON with overall_health, sla_status, bottlenecks, alerts, metrics, recommendations, audit.`;
}
