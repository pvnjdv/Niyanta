import { Agent } from '../types/agent';

export interface AgentBlueprint {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
}

export const DEFAULT_AGENT_COPY_PREFIX = 'def_';

export const DEFAULT_AGENT_BLUEPRINTS: AgentBlueprint[] = [
  {
    id: 'meeting',
    name: 'Meeting Intelligence',
    subtitle: 'Transcript to action',
    icon: 'MI',
    color: '#666666',
    glow: 'rgba(102,102,102,0.2)',
    description: 'Extracts outcomes from meeting transcripts.',
    capabilities: ['summary', 'decisions', 'tasks', 'risks'],
    systemPrompt:
      'You are the Meeting Intelligence Agent. Analyze meeting transcripts and extract summary, attendees, decisions, tasks (with owners and deadlines), risks, sentiment, and WHY-CHAIN audit trail. Respond only with valid JSON containing: summary, attendees, decisions, tasks, risks, sentiment, whyChain.',
  },
  {
    id: 'invoice',
    name: 'Invoice Processor',
    subtitle: 'AP approval intelligence',
    icon: 'IP',
    color: '#888888',
    glow: 'rgba(136,136,136,0.2)',
    description: 'Validates invoices and makes decision recommendations.',
    capabilities: ['validation', 'decisioning', 'anomaly checks'],
    systemPrompt:
      'You are the Invoice Processing Agent. Analyze invoice data and decide AUTO-APPROVE, FLAG, or REJECT based on amount thresholds, anomalies, vendor history, and completeness. Return strict JSON with: decision, confidence, reason, lineItems, anomalies, complianceChecks, whyChain.',
  },
  {
    id: 'document',
    name: 'Document Intelligence',
    subtitle: 'Document understanding',
    icon: 'DI',
    color: '#AAAAAA',
    glow: 'rgba(170,170,170,0.2)',
    description: 'Classifies and extracts document data.',
    capabilities: ['classification', 'field extraction', 'validation'],
    systemPrompt:
      'You are the Document Intelligence Agent. Detect document type, extract structured fields, identify missing required fields, validate data formats, and flag discrepancies. Return strict JSON with: documentType, confidence, extractedFields, missingFields, validationStatus, flags, whyChain.',
  },
  {
    id: 'finance_ops',
    name: 'Finance Operations',
    subtitle: 'Budget & expense intelligence',
    icon: 'FO',
    color: '#059669',
    glow: 'rgba(5,150,105,0.2)',
    description: 'Analyzes financial data, monitors budgets, and detects expense anomalies.',
    capabilities: ['budget analysis', 'expense tracking', 'anomaly detection', 'forecasting'],
    systemPrompt:
      'You are the Finance Operations Agent. Analyze financial data including budgets, expenses, purchase orders, and invoices. Detect anomalies, track budget utilization, and generate financial insights. Return strict JSON with: summary, budgetStatus, anomalies, recommendations, riskLevel, whyChain.',
  },
  {
    id: 'hr_ops',
    name: 'HR Operations',
    subtitle: 'People & workforce intelligence',
    icon: 'HR',
    color: '#EC4899',
    glow: 'rgba(236,72,153,0.2)',
    description: 'Manages HR workflows including onboarding, leave requests, and compliance.',
    capabilities: ['onboarding', 'leave management', 'compliance', 'performance tracking'],
    systemPrompt:
      'You are the HR Operations Agent. Handle employee requests including onboarding, leave management, policy queries, and performance tracking. Ensure compliance with HR policies. Return strict JSON with: requestType, decision, reason, nextSteps, complianceStatus, whyChain.',
  },
  {
    id: 'it_ops',
    name: 'IT Operations',
    subtitle: 'Access & incident management',
    icon: 'IT',
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.2)',
    description: 'Processes access requests, incidents, and asset workflows with priority and SLA.',
    capabilities: ['access requests', 'incident management', 'asset tracking', 'SLA monitoring'],
    systemPrompt:
      'You are the IT Operations Agent inside Niyanta AI. Process access requests, incidents, and asset workflows with priority and SLA. Return strict JSON with request_type, priority, affected_systems, access_requests, incident, assets, escalation_required, audit.',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    subtitle: 'Policy & regulatory intelligence',
    icon: 'CO',
    color: '#F59E0B',
    glow: 'rgba(245,158,11,0.2)',
    description: 'Evaluates policy violations, regulatory risks, and compliance gaps.',
    capabilities: ['policy evaluation', 'regulatory checks', 'risk scoring', 'violation detection'],
    systemPrompt:
      'You are the Compliance Agent inside Niyanta AI. Evaluate policy violations, regulatory risks, and compliance gaps. Return strict JSON with compliance_status, regulations_checked, violations, risk_score, recommended_actions, audit.',
  },
  {
    id: 'security',
    name: 'Security Monitor',
    subtitle: 'Threat & incident response',
    icon: 'SM',
    color: '#EF4444',
    glow: 'rgba(239,68,68,0.2)',
    description: 'Classifies security incidents and defines immediate response actions.',
    capabilities: ['incident classification', 'threat assessment', 'response planning', 'escalation'],
    systemPrompt:
      'You are the Security Monitor Agent inside Niyanta AI. Classify incidents by CRITICAL/HIGH/MEDIUM/LOW and define immediate response. Return strict JSON with severity, confidence, affected, immediate_actions, escalation, regulatory_impact, audit.',
  },
  {
    id: 'procurement',
    name: 'Procurement',
    subtitle: 'Purchase & vendor intelligence',
    icon: 'PR',
    color: '#8B5CF6',
    glow: 'rgba(139,92,246,0.2)',
    description: 'Applies thresholds and quote requirements to build approval chains.',
    capabilities: ['purchase approval', 'vendor evaluation', 'policy checks', 'compliance flags'],
    systemPrompt:
      'You are the Procurement Agent inside Niyanta AI. Apply thresholds and quote requirements to build approval chain. Return strict JSON with decision, approval_chain, policy_checks, compliance_flags, timeline, next_steps, audit.',
  },
  {
    id: 'workflow',
    name: 'Workflow Intelligence',
    subtitle: 'Optimization & routing',
    icon: 'WI',
    color: '#06B6D4',
    glow: 'rgba(6,182,212,0.2)',
    description: 'Analyzes workflows and suggests optimization and routing improvements.',
    capabilities: ['workflow analysis', 'optimization', 'routing recommendations', 'risk assessment'],
    systemPrompt:
      'You are the Workflow Intelligence Agent inside Niyanta AI. Analyze workflow data and suggest optimization and routing improvements. Return strict JSON with workflow_analysis, optimization_suggestions, routing_recommendations, risk_assessment, audit.',
  },
];

export function getDefaultAgentCopyId(agentId: string): string {
  return `${DEFAULT_AGENT_COPY_PREFIX}${agentId}`;
}

export function resolveAgentSampleKey(agentId: string): string {
  return agentId.startsWith(DEFAULT_AGENT_COPY_PREFIX)
    ? agentId.slice(DEFAULT_AGENT_COPY_PREFIX.length)
    : agentId;
}

export function createDisplayAgent(
  blueprint: AgentBlueprint,
  options?: { id?: string; isDefault?: boolean; isTemplate?: boolean }
): Agent {
  return {
    id: options?.id || blueprint.id,
    name: blueprint.name,
    subtitle: blueprint.subtitle,
    icon: blueprint.icon,
    color: blueprint.color,
    glow: blueprint.glow,
    description: blueprint.description,
    capabilities: blueprint.capabilities,
    status: 'idle',
    isDefault: options?.isDefault,
    isTemplate: options?.isTemplate,
  };
}

export function createDefaultAgentList(): Agent[] {
  return DEFAULT_AGENT_BLUEPRINTS.map((blueprint) =>
    createDisplayAgent(blueprint, {
      id: getDefaultAgentCopyId(blueprint.id),
      isDefault: true,
      isTemplate: false,
    })
  );
}

export function buildAgentCanvasLayout(
  blueprint: AgentBlueprint,
  workflowId: string
): Array<Record<string, unknown>> {
  const decisionId = `canvas-${workflowId}-decision`;
  const workflowBlockId = `canvas-${workflowId}-workflow`;
  const auditId = `canvas-${workflowId}-audit`;

  return [
    {
      id: 'anchor-start',
      blockType: 'workflow',
      refId: '__start__',
      name: 'Input',
      category: 'anchor',
      x: 60,
      y: 80,
      inputInfo: 'Incoming user request, document, or event payload.',
    },
    {
      id: decisionId,
      blockType: 'node',
      refId: 'Decision',
      name: 'Decision',
      category: 'Logic',
      color: '#6B7280',
      x: 320,
      y: 80,
      inputInfo: `Evaluate risk, confidence, and whether ${blueprint.name} can proceed autonomously.`,
    },
    {
      id: workflowBlockId,
      blockType: 'workflow',
      refId: workflowId,
      name: `${blueprint.name} Core Workflow`,
      category: 'AI Agent',
      color: blueprint.color,
      x: 620,
      y: 80,
      inputInfo: `Execute the reusable ${blueprint.name.toLowerCase()} workflow with modular steps.`,
    },
    {
      id: auditId,
      blockType: 'node',
      refId: 'Audit Log',
      name: 'Audit Log',
      category: 'Actions',
      color: '#F59E0B',
      x: 920,
      y: 80,
      inputInfo: 'Record the decision, workflow outcome, and any fallback handling.',
    },
    {
      id: 'anchor-end',
      blockType: 'workflow',
      refId: '__end__',
      name: 'Niyanta Output',
      category: 'anchor',
      x: 1220,
      y: 80,
      inputInfo: 'Return the result to the orchestrator and live UI surfaces.',
    },
    {
      id: '__edges__',
      blockType: 'workflow',
      refId: '__edges__',
      name: '__edges__',
      category: 'meta',
      x: 0,
      y: 0,
      inputInfo: JSON.stringify([
        { id: `edge-${workflowId}-start`, from: '__start__', to: decisionId },
        { id: `edge-${workflowId}-decision`, from: decisionId, to: workflowBlockId },
        { id: `edge-${workflowId}-workflow`, from: workflowBlockId, to: auditId },
        { id: `edge-${workflowId}-audit`, from: auditId, to: '__end__' },
      ]),
    },
  ];
}

export function buildAgentWorkflowSeed(
  blueprint: AgentBlueprint,
  agentId: string
): {
  workflowId: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  triggers: string[];
  nodes: Array<Record<string, unknown>>;
  edges: Array<Record<string, unknown>>;
} {
  const workflowId = `wf_agent_${agentId}`;
  const triggerId = `${agentId}_trigger`;
  const decisionId = `${agentId}_decision`;
  const llmId = `${agentId}_analysis`;
  const auditId = `${agentId}_audit`;

  return {
    workflowId,
    name: `${blueprint.name} Agent Workflow`,
    description: `Workflow backing the ${blueprint.name} agent`,
    category: 'AI Agent',
    tags: ['agent', blueprint.id, ...blueprint.capabilities.slice(0, 2)],
    triggers: ['manual', `${blueprint.id}_request`],
    nodes: [
      {
        instanceId: triggerId,
        nodeType: 'manual_trigger',
        name: 'Input Trigger',
        config: {},
        position: { x: 80, y: 200 },
        retryConfig: { maxRetries: 1, timeout: 30, failurePolicy: 'fail' },
      },
      {
        instanceId: decisionId,
        nodeType: 'decision',
        name: 'Decision Router',
        config: {
          mode: 'agent',
          criteria: ['risk', 'confidence', 'approval_required'],
        },
        position: { x: 320, y: 200 },
        retryConfig: { maxRetries: 1, timeout: 20, failurePolicy: 'retry' },
      },
      {
        instanceId: llmId,
        nodeType: 'llm_analysis',
        name: `${blueprint.name} Analysis`,
        config: { prompt: blueprint.systemPrompt },
        position: { x: 600, y: 200 },
        retryConfig: { maxRetries: 2, timeout: 45, failurePolicy: 'retry' },
      },
      {
        instanceId: auditId,
        nodeType: 'audit_log',
        name: 'Audit Result',
        config: { action: `${blueprint.id}-agent-run` },
        position: { x: 860, y: 200 },
        retryConfig: { maxRetries: 1, timeout: 20, failurePolicy: 'continue' },
      },
    ],
    edges: [
      {
        id: `edge-${workflowId}-trigger`,
        fromNodeId: triggerId,
        toNodeId: decisionId,
      },
      {
        id: `edge-${workflowId}-decision`,
        fromNodeId: decisionId,
        toNodeId: llmId,
      },
      {
        id: `edge-${workflowId}-audit`,
        fromNodeId: llmId,
        toNodeId: auditId,
      },
    ],
  };
}