import { v4 as uuid } from 'uuid';

export interface BrowserWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: string;
  triggers: string[];
  nodes: Array<{
    id: string;
    type: string;
    name: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    fromNodeId: string;
    toNodeId: string;
    condition?: string;
  }>;
}

export const BROWSER_WORKFLOW_TEMPLATES: BrowserWorkflowTemplate[] = [
  {
    id: 'invoice-approval-flow',
    name: 'Invoice Approval Workflow',
    description: 'Invoice intake, validation, approval, and notification flow.',
    category: 'Finance',
    tags: ['invoice', 'approval', 'finance'],
    complexity: 'intermediate',
    estimatedTime: '5-10 min',
    icon: '💰',
    triggers: ['invoice_uploaded'],
    nodes: [
      { id: 'n1', type: 'Manual Trigger', name: 'Invoice Submitted', position: { x: 60, y: 220 }, config: {} },
      { id: 'n2', type: 'Validation', name: 'Validate Invoice', position: { x: 340, y: 220 }, config: { rules: 'required:amount,required:vendor' } },
      { id: 'n3', type: 'Approval', name: 'Manager Approval', position: { x: 620, y: 220 }, config: { title: 'Invoice Approval', assignedTo: 'admin', priority: 'high', deadline: '24h' } },
      { id: 'n4', type: 'Notification', name: 'Send Status', position: { x: 900, y: 220 }, config: { channel: 'internal', message: 'Invoice processed' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
    ],
  },
  {
    id: 'meeting-intelligence',
    name: 'Meeting Intelligence Workflow',
    description: 'Transcript analysis, action-item extraction, and notifications.',
    category: 'Operations',
    tags: ['meeting', 'transcript', 'analysis'],
    complexity: 'intermediate',
    estimatedTime: '3-5 min',
    icon: '🎯',
    triggers: ['transcript_uploaded'],
    nodes: [
      { id: 'n1', type: 'File Upload', name: 'Transcript Upload', position: { x: 60, y: 220 }, config: {} },
      { id: 'n2', type: 'LLM Reasoning', name: 'Extract Meeting Intel', position: { x: 340, y: 220 }, config: { prompt: 'Summarize meeting, tasks, risks, and decisions.' } },
      { id: 'n3', type: 'Task Assignment', name: 'Create Actions', position: { x: 620, y: 220 }, config: { assignTo: 'team-lead', dueDate: '3d' } },
      { id: 'n4', type: 'Notification', name: 'Notify Team', position: { x: 900, y: 220 }, config: { channel: 'internal', message: 'Meeting summary ready' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
    ],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Automation',
    description: 'Validate new hire data, assign tasks, and notify stakeholders.',
    category: 'HR',
    tags: ['hr', 'onboarding', 'employee'],
    complexity: 'advanced',
    estimatedTime: '10-15 min',
    icon: '👥',
    triggers: ['employee_hired'],
    nodes: [
      { id: 'n1', type: 'API Trigger', name: 'New Hire Event', position: { x: 60, y: 220 }, config: { source: 'HRIS' } },
      { id: 'n2', type: 'Validation', name: 'Validate Record', position: { x: 340, y: 220 }, config: { rules: 'required:email,required:manager' } },
      { id: 'n3', type: 'Task Assignment', name: 'Provision Access', position: { x: 620, y: 120 }, config: { assignTo: 'it-team', dueDate: '2d' } },
      { id: 'n4', type: 'Task Assignment', name: 'Prepare Welcome', position: { x: 620, y: 320 }, config: { assignTo: 'hr-team', dueDate: '2d' } },
      { id: 'n5', type: 'Notification', name: 'Notify Manager', position: { x: 900, y: 220 }, config: { channel: 'internal', message: 'Onboarding started' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n2', toNodeId: 'n4' },
      { id: 'e4', fromNodeId: 'n3', toNodeId: 'n5' },
      { id: 'e5', fromNodeId: 'n4', toNodeId: 'n5' },
    ],
  },
  {
    id: 'security-incident-response',
    name: 'Security Incident Response',
    description: 'Threat analysis, escalation, approval, and logging.',
    category: 'Security',
    tags: ['security', 'incident', 'response'],
    complexity: 'advanced',
    estimatedTime: '8-12 min',
    icon: '🔒',
    triggers: ['security_alert'],
    nodes: [
      { id: 'n1', type: 'API Trigger', name: 'Security Alert', position: { x: 60, y: 220 }, config: {} },
      { id: 'n2', type: 'Risk Analysis', name: 'Score Threat', position: { x: 340, y: 220 }, config: { threshold: 0.8 } },
      { id: 'n3', type: 'Approval', name: 'Authorize Containment', position: { x: 620, y: 220 }, config: { title: 'Security Containment', assignedTo: 'admin', priority: 'critical', deadline: '30m' } },
      { id: 'n4', type: 'Audit Log', name: 'Record Incident', position: { x: 900, y: 220 }, config: { action: 'security-incident' } },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'n1', toNodeId: 'n2' },
      { id: 'e2', fromNodeId: 'n2', toNodeId: 'n3' },
      { id: 'e3', fromNodeId: 'n3', toNodeId: 'n4' },
    ],
  },
];

export function instantiateBrowserTemplate(template: BrowserWorkflowTemplate, customName?: string) {
  const nodeIdMap = new Map<string, string>();
  const nodes = template.nodes.map((node) => {
    const instanceId = `node-${uuid()}`;
    nodeIdMap.set(node.id, instanceId);
    return {
      instanceId,
      nodeType: normalizeTemplateNodeType(node.type),
      name: node.name,
      config: node.config,
      position: node.position,
      retryConfig: { maxRetries: 3, timeout: 30, failurePolicy: 'retry' },
    };
  });

  const edges = template.edges.map((edge) => ({
    id: `edge-${uuid()}`,
    fromNodeId: nodeIdMap.get(edge.fromNodeId) || edge.fromNodeId,
    toNodeId: nodeIdMap.get(edge.toNodeId) || edge.toNodeId,
    condition: edge.condition,
  }));

  return {
    name: customName || template.name,
    description: template.description,
    category: template.category,
    tags: template.tags,
    triggers: template.triggers,
    nodes,
    edges,
  };
}

function normalizeTemplateNodeType(type: string): string {
  return type.toLowerCase().replace(/\s+/g, '_');
}