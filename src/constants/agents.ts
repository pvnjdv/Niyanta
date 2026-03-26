import { Agent } from '../types/agent';

export const AGENTS: Record<string, Agent> = {
  meeting: { id: 'meeting', name: 'Meeting Intelligence', subtitle: 'Transcript to action', icon: 'MI', color: '#00D4FF', glow: 'rgba(0,212,255,0.2)', description: 'Extracts decisions, owners, risks, and next steps from meetings.', capabilities: ['summary', 'tasks', 'decisions', 'risks'], status: 'idle' },
  invoice: { id: 'invoice', name: 'Invoice Processor', subtitle: 'AP approval intelligence', icon: 'IP', color: '#FFB800', glow: 'rgba(255,184,0,0.2)', description: 'Validates invoices and issues approve/flag/reject decisions.', capabilities: ['validation', 'anomaly detection', 'decision'], status: 'idle' },
  hr: { id: 'hr', name: 'HR Operations', subtitle: 'Onboarding planner', icon: 'HR', color: '#00E676', glow: 'rgba(0,230,118,0.2)', description: 'Builds onboarding plans with least-privilege access.', capabilities: ['onboarding', 'checklists', 'access'], status: 'idle' },
  procurement: { id: 'procurement', name: 'Procurement', subtitle: 'Purchase governance', icon: 'PR', color: '#FF6B6B', glow: 'rgba(255,107,107,0.2)', description: 'Evaluates requests and computes approval chains.', capabilities: ['approval routing', 'policy checks', 'vendor quotes'], status: 'idle' },
  security: { id: 'security', name: 'Security Monitor', subtitle: 'Incident triage', icon: 'SM', color: '#FF4488', glow: 'rgba(255,68,136,0.2)', description: 'Classifies threats and returns immediate response playbooks.', capabilities: ['classification', 'containment', 'escalation'], status: 'idle' },
  compliance: { id: 'compliance', name: 'Compliance Agent', subtitle: 'Regulation checks', icon: 'CA', color: '#A78BFA', glow: 'rgba(167,139,250,0.2)', description: 'Finds policy gaps and regulatory risk with remediation.', capabilities: ['GDPR', 'SOX', 'PCI-DSS'], status: 'idle' },
  document: { id: 'document', name: 'Document Intelligence', subtitle: 'Document understanding', icon: 'DI', color: '#F59E0B', glow: 'rgba(245,158,11,0.2)', description: 'Classifies documents and extracts structured fields.', capabilities: ['classification', 'field extraction', 'validation'], status: 'idle' },
  monitoring: { id: 'monitoring', name: 'Monitoring Agent', subtitle: 'SLA and bottlenecks', icon: 'MO', color: '#60A5FA', glow: 'rgba(96,165,250,0.2)', description: 'Detects SLA risks and operational bottlenecks.', capabilities: ['SLA', 'alerts', 'health'], status: 'idle' },
  workflow: { id: 'workflow', name: 'Workflow Intelligence', subtitle: 'Optimization advisor', icon: 'WI', color: '#34D399', glow: 'rgba(52,211,153,0.2)', description: 'Suggests optimization and routing improvements.', capabilities: ['optimization', 'critical path', 'parallelization'], status: 'idle' },
  it_ops: { id: 'it_ops', name: 'IT Operations', subtitle: 'Access and incidents', icon: 'IT', color: '#F472B6', glow: 'rgba(244,114,182,0.2)', description: 'Handles access requests and incident triage.', capabilities: ['access', 'incident', 'asset management'], status: 'idle' }
};

export const AGENT_LIST = Object.values(AGENTS);
