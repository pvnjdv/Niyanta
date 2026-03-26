import { AgentDefinition } from '../types/agent.types';

export class AgentManager {
  private agents: Map<string, AgentDefinition>;

  constructor() {
    this.agents = new Map();
    this.registerAllAgents();
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  private registerAllAgents(): void {
    const agentDefinitions: AgentDefinition[] = [
      {
        agent_id: 'meeting',
        name: 'Meeting Intelligence',
        subtitle: 'Transcript to action',
        icon: 'MI',
        color: '#00D4FF',
        glow: 'rgba(0,212,255,0.2)',
        capabilities: ['summary', 'decisions', 'tasks', 'risks'],
        status: 'active',
        description: 'Extracts outcomes from meeting transcripts.',
        systemPrompt:
          'You are the Meeting Intelligence Agent. Analyze meeting transcripts and extract summary, attendees, decisions, tasks, risks, sentiment, and WHY-CHAIN audit. Respond only with valid JSON.'
      },
      {
        agent_id: 'invoice',
        name: 'Invoice Processor',
        subtitle: 'AP approval intelligence',
        icon: 'IP',
        color: '#FFB800',
        glow: 'rgba(255,184,0,0.2)',
        capabilities: ['validation', 'decisioning', 'anomaly checks'],
        status: 'active',
        description: 'Validates invoices and makes decision recommendations.',
        systemPrompt:
          'You are the Invoice Processing Agent. Decide AUTO-APPROVE, FLAG, or REJECT using amount, anomalies, and completeness. Return strict JSON with decision, reason, anomalies, compliance checks, and audit.'
      },
      {
        agent_id: 'hr',
        name: 'HR Operations',
        subtitle: 'Onboarding planner',
        icon: 'HR',
        color: '#00E676',
        glow: 'rgba(0,230,118,0.2)',
        capabilities: ['onboarding', 'access planning', 'compliance'],
        status: 'active',
        description: 'Creates structured onboarding plans.',
        systemPrompt:
          'You are the HR Operations Agent. Build onboarding plan with documents, access, checklist by timeline, meetings, equipment, and WHY-CHAIN audit. Return strict JSON.'
      },
      {
        agent_id: 'procurement',
        name: 'Procurement',
        subtitle: 'Purchase governance',
        icon: 'PR',
        color: '#FF6B6B',
        glow: 'rgba(255,107,107,0.2)',
        capabilities: ['approval routing', 'policy checks', 'vendor guidance'],
        status: 'active',
        description: 'Routes procurement requests with policy thresholds.',
        systemPrompt:
          'You are the Procurement Agent. Compute approval chain and decision with policy checks and compliance flags. Return strict JSON only.'
      },
      {
        agent_id: 'security',
        name: 'Security Monitor',
        subtitle: 'Incident triage',
        icon: 'SM',
        color: '#FF4488',
        glow: 'rgba(255,68,136,0.2)',
        capabilities: ['severity classification', 'containment', 'escalation'],
        status: 'active',
        description: 'Classifies and responds to security incidents.',
        systemPrompt:
          'You are the Security Monitor Agent. Classify severity, impact, immediate actions, escalation path, and regulatory impact. Return strict JSON only.'
      },
      {
        agent_id: 'compliance',
        name: 'Compliance Agent',
        subtitle: 'Policy and regulation checks',
        icon: 'CA',
        color: '#A78BFA',
        glow: 'rgba(167,139,250,0.2)',
        capabilities: ['regulatory risk', 'violations', 'remediation'],
        status: 'active',
        description: 'Assesses compliance posture.',
        systemPrompt:
          'You are the Compliance Agent. Evaluate regulatory risks and policy violations with remediation actions. Return strict JSON only.'
      },
      {
        agent_id: 'document',
        name: 'Document Intelligence',
        subtitle: 'Document understanding',
        icon: 'DI',
        color: '#F59E0B',
        glow: 'rgba(245,158,11,0.2)',
        capabilities: ['classification', 'field extraction', 'validation'],
        status: 'active',
        description: 'Classifies and extracts document data.',
        systemPrompt:
          'You are the Document Intelligence Agent. Detect document type, fields, missing fields, and validation status. Return strict JSON only.'
      },
      {
        agent_id: 'monitoring',
        name: 'Monitoring Agent',
        subtitle: 'SLA and ops telemetry',
        icon: 'MO',
        color: '#60A5FA',
        glow: 'rgba(96,165,250,0.2)',
        capabilities: ['sla', 'bottlenecks', 'alerts'],
        status: 'active',
        description: 'Analyzes operational health and SLA risk.',
        systemPrompt:
          'You are the Monitoring Agent. Analyze SLA status, bottlenecks, alerts, and recommendations. Return strict JSON only.'
      },
      {
        agent_id: 'workflow',
        name: 'Workflow Intelligence',
        subtitle: 'Optimization advisor',
        icon: 'WI',
        color: '#34D399',
        glow: 'rgba(52,211,153,0.2)',
        capabilities: ['critical path', 'optimization', 'routing'],
        status: 'active',
        description: 'Optimizes workflow design and execution.',
        systemPrompt:
          'You are the Workflow Intelligence Agent. Provide optimization suggestions and routing recommendations from execution data. Return strict JSON only.'
      },
      {
        agent_id: 'it_ops',
        name: 'IT Operations',
        subtitle: 'Access and incidents',
        icon: 'IT',
        color: '#F472B6',
        glow: 'rgba(244,114,182,0.2)',
        capabilities: ['request triage', 'incident planning', 'asset handling'],
        status: 'active',
        description: 'Manages IT requests and incident response plans.',
        systemPrompt:
          'You are the IT Operations Agent. Process access and incident requests with priority, SLA, escalation, and next steps in strict JSON.'
      }
    ];

    for (const agent of agentDefinitions) {
      this.agents.set(agent.agent_id, agent);
    }
  }
}
