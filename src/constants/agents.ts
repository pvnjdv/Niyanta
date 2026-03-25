import { Agent, AgentId } from '../types';

export const AGENTS: Record<AgentId, Agent> = {
  meeting: {
    id: 'meeting',
    name: 'Meeting Intelligence',
    subtitle: 'Extract decisions, tasks & risks from transcripts',
    icon: 'M',
    color: '#00D4FF',
    glow: 'rgba(0, 212, 255, 0.25)',
    description: 'Analyzes meeting transcripts to extract actionable intelligence including decisions made, action items with owners, risks identified, and follow-up recommendations.',
  },
  invoice: {
    id: 'invoice',
    name: 'Invoice Processing',
    subtitle: 'Validate & approve invoices autonomously',
    icon: 'I',
    color: '#FFB800',
    glow: 'rgba(255, 184, 0, 0.25)',
    description: 'Processes invoices to validate vendor information, verify line items, check compliance, and make autonomous approval decisions based on configurable thresholds.',
  },
  hr: {
    id: 'hr',
    name: 'HR Onboarding',
    subtitle: 'Create comprehensive onboarding plans',
    icon: 'H',
    color: '#00E676',
    glow: 'rgba(0, 230, 118, 0.25)',
    description: 'Generates detailed onboarding plans for new employees including IT provisioning, compliance requirements, training schedules, and buddy assignments.',
  },
  procurement: {
    id: 'procurement',
    name: 'Procurement',
    subtitle: 'Evaluate requests & route approvals',
    icon: 'P',
    color: '#FF6B6B',
    glow: 'rgba(255, 107, 107, 0.25)',
    description: 'Evaluates purchase requests against policy thresholds, determines approval chains, validates vendor requirements, and routes for appropriate sign-off.',
  },
  security: {
    id: 'security',
    name: 'Security Monitor',
    subtitle: 'Analyze threats & coordinate response',
    icon: 'S',
    color: '#FF4488',
    glow: 'rgba(255, 68, 136, 0.25)',
    description: 'Monitors security events, assesses threat severity, determines blast radius, coordinates containment actions, and escalates to humans when required.',
  },
};

export const AGENT_LIST: Agent[] = Object.values(AGENTS);

export const AGENT_PLACEHOLDERS: Record<AgentId, string> = {
  meeting: 'Paste a meeting transcript or notes here — attendees, decisions, action items...',
  invoice: 'Paste invoice text here — vendor, line items, amounts, due dates, PO number...',
  hr: 'Paste new hire details here — name, role, start date, manager, special requirements...',
  procurement: 'Paste purchase request here — item, cost, department, business justification...',
  security: 'Paste security event or incident report here — timestamps, IPs, affected systems...',
};
