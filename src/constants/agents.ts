import { Agent } from '../types/agent';

export const AGENTS: Record<string, Agent> = {
  meeting: { id: 'meeting', name: 'Meeting Intelligence', subtitle: 'Transcript to action', icon: 'MI', color: '#666666', glow: 'rgba(102,102,102,0.2)', description: 'Extracts decisions, owners, risks, and next steps from meetings.', capabilities: ['summary', 'tasks', 'decisions', 'risks'], status: 'idle' },
  invoice: { id: 'invoice', name: 'Invoice Processor', subtitle: 'AP approval intelligence', icon: 'IP', color: '#888888', glow: 'rgba(136,136,136,0.2)', description: 'Validates invoices and issues approve/flag/reject decisions.', capabilities: ['validation', 'anomaly detection', 'decision'], status: 'idle' },
  document: { id: 'document', name: 'Document Intelligence', subtitle: 'Document understanding', icon: 'DI', color: '#AAAAAA', glow: 'rgba(170,170,170,0.2)', description: 'Classifies documents and extracts structured fields.', capabilities: ['classification', 'field extraction', 'validation'], status: 'idle' },
};

export const AGENT_LIST = Object.values(AGENTS);
