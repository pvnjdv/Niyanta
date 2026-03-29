import { v4 as uuid } from 'uuid';
import { AGENT_LIST } from '../constants/agents';
import { BROWSER_WORKFLOW_TEMPLATES, instantiateBrowserTemplate } from '../constants/browserTemplates';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';
import { isBrowserStorageMode } from './storageMode';

type JsonRecord = Record<string, unknown>;

interface BrowserAgentRecord {
  id: string;
  agent_id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
  capabilities: string[];
  status: string;
  system_prompt: string;
  workflow_id?: string;
  is_template?: number;
  is_default?: number;
  canvas_layout?: unknown[];
  created_at: string;
}

interface BrowserWorkflowRecord {
  id: string;
  name: string;
  description: string;
  nodes: string;
  edges: string;
  status: 'draft' | 'active' | 'disabled';
  category: string;
  tags: string;
  triggers: string;
  allow_agent_invocation: number;
  is_default: number;
  is_agent: number;
  created_at: string;
  updated_at: string;
}

interface BrowserApprovalRecord {
  id: string;
  workflow_run_id: string;
  workflow_id: string;
  workflow_name: string;
  node_id: string;
  node_name: string;
  title: string;
  description: string;
  context: JsonRecord;
  assigned_to: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  escalation_policy: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  decision_comment: string | null;
  decision_data?: JsonRecord | null;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

interface BrowserAuditEntry {
  id: string;
  agent_id: string | null;
  event_type: string;
  event: string;
  decision?: string | null;
  input_preview?: string | null;
  processing_time_ms?: number | null;
  metadata?: string | null;
  timestamp: string;
}

interface BrowserWorkflowLog {
  id: string;
  run_id: string;
  node_id: string;
  node_type: string;
  status: string;
  duration_ms: number;
  error?: string | null;
  timestamp: string;
}

interface BrowserRunRecord {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  trigger_source: string;
  context: string;
  error_message?: string | null;
}

interface BrowserVersionRecord {
  id: string;
  workflow_id: string;
  version_number: number;
  name: string;
  description: string;
  nodes: string;
  edges: string;
  status: string;
  category: string;
  tags: string;
  triggers: string;
  change_summary: string;
  created_by: string;
  created_at: string;
}

interface BrowserStoreShape {
  agents: BrowserAgentRecord[];
  workflows: BrowserWorkflowRecord[];
  approvals: BrowserApprovalRecord[];
  auditEntries: BrowserAuditEntry[];
  runs: BrowserRunRecord[];
  workflowLogs: BrowserWorkflowLog[];
  versions: BrowserVersionRecord[];
  agentWorkflowLinks: Array<{ agent_id: string; workflow_id: string; can_trigger: number; can_modify: number; created_at: string }>;
  templates: typeof BROWSER_WORKFLOW_TEMPLATES;
}

const STORE_KEY = 'niyanta-browser-store-v1';
const FETCH_MARKER = '__niyantaBrowserInterceptorInstalled';

const emptyDecisionBreakdown = {
  autoApprove: 0,
  approved: 0,
  flag: 0,
  reject: 0,
  proceed: 0,
  hold: 0,
  escalate: 0,
  other: 0,
};

function minutesAgoIso(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeMetadata(value?: Record<string, unknown>): string | null {
  return value ? JSON.stringify(value) : null;
}

function resolveDeadline(startedAt: string, rawValue: unknown): string | null {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return null;
  }

  const match = rawValue.trim().match(/^(\d+)([mhd])$/i);
  if (!match) {
    return rawValue;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 60 * 1000;
  return new Date(new Date(startedAt).getTime() + amount * multiplier).toISOString();
}

function getP95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function formatDurationLabel(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return 'No SLA';
  }
  if (minutes >= 60) {
    return `${Math.round((minutes / 60) * 10) / 10}h`;
  }
  return `${Math.round(minutes)}m`;
}

function buildDefaultStore(): BrowserStoreShape {
  const now = new Date().toISOString();
  const agents: BrowserAgentRecord[] = AGENT_LIST.map((agent) => ({
    id: agent.id,
    agent_id: agent.id,
    name: agent.name,
    subtitle: agent.subtitle,
    icon: agent.icon,
    color: agent.color,
    glow: agent.glow,
    description: agent.description,
    capabilities: agent.capabilities,
    status: 'active',
    system_prompt: `You are ${agent.name}. ${agent.description}`,
    is_template: 1,
    is_default: 1,
    canvas_layout: [],
    created_at: now,
  }));

  const templateMap = new Map(BROWSER_WORKFLOW_TEMPLATES.map((template) => [template.id, template]));
  const workflowSeeds = [
    { id: 'wf-browser-invoice', templateId: 'invoice-approval-flow', name: 'Invoice Approval Workflow' },
    { id: 'wf-browser-meeting', templateId: 'meeting-intelligence', name: 'Meeting Intelligence Workflow' },
    { id: 'wf-browser-onboarding', templateId: 'employee-onboarding', name: 'Employee Onboarding Automation' },
    { id: 'wf-browser-security', templateId: 'security-incident-response', name: 'Security Incident Response' },
  ];

  const workflows: BrowserWorkflowRecord[] = workflowSeeds.map((seed) => {
    const template = templateMap.get(seed.templateId)!;
    const workflow = instantiateBrowserTemplate(template, seed.name);
    return {
      id: seed.id,
      name: workflow.name,
      description: workflow.description,
      nodes: JSON.stringify(workflow.nodes),
      edges: JSON.stringify(workflow.edges),
      status: 'active',
      category: workflow.category,
      tags: JSON.stringify(workflow.tags),
      triggers: JSON.stringify(workflow.triggers),
      allow_agent_invocation: 1,
      is_default: 1,
      is_agent: 0,
      created_at: now,
      updated_at: now,
    };
  });

  const workflowById = new Map(workflows.map((workflow) => [workflow.id, workflow]));
  const nodesFor = (workflowId: string) => parseJsonArray<Record<string, unknown>>(workflowById.get(workflowId)?.nodes || '[]');
  const invoiceNodes = nodesFor('wf-browser-invoice');
  const meetingNodes = nodesFor('wf-browser-meeting');
  const onboardingNodes = nodesFor('wf-browser-onboarding');
  const securityNodes = nodesFor('wf-browser-security');
  const invoiceApprovalNode = invoiceNodes.find((node) => normalizeNodeType(node.nodeType) === 'approval') || {};
  const securityApprovalNode = securityNodes.find((node) => normalizeNodeType(node.nodeType) === 'approval') || {};

  const invoiceRunStartedAt = minutesAgoIso(180);
  const meetingRunStartedAt = minutesAgoIso(95);
  const onboardingRunStartedAt = minutesAgoIso(58);
  const securityRunStartedAt = minutesAgoIso(18);

  const runs: BrowserRunRecord[] = [
    {
      id: 'run-browser-security-1',
      workflow_id: 'wf-browser-security',
      status: 'WAITING_APPROVAL',
      started_at: securityRunStartedAt,
      completed_at: null,
      trigger_source: 'browser',
      context: JSON.stringify({
        workflowId: 'wf-browser-security',
        workflowName: workflowById.get('wf-browser-security')?.name,
        task: {
          title: 'Contain suspicious endpoint activity',
          owner: 'Security Lead',
          priority: 'critical',
          status: 'waiting_approval',
        },
        metadata: {
          agentId: 'security',
          agentName: 'Security Monitor',
          input: 'Critical EDR alert detected on finance workstation.',
          notifications: ['Security containment waiting for approval.'],
        },
        workflowState: {
          currentNodeId: securityApprovalNode.instanceId,
          executedNodeIds: securityNodes.slice(0, 3).map((node) => String(node.instanceId)),
          pendingNodeIds: securityNodes.slice(3).map((node) => String(node.instanceId)),
        },
      }),
      error_message: null,
    },
    {
      id: 'run-browser-onboarding-1',
      workflow_id: 'wf-browser-onboarding',
      status: 'FAILED',
      started_at: onboardingRunStartedAt,
      completed_at: minutesAgoIso(51),
      trigger_source: 'browser',
      context: JSON.stringify({
        workflowId: 'wf-browser-onboarding',
        workflowName: workflowById.get('wf-browser-onboarding')?.name,
        task: {
          title: 'Provision access for new hire',
          owner: 'IT Operations',
          priority: 'high',
          status: 'blocked',
        },
        metadata: {
          agentId: 'hr_ops',
          agentName: 'HR Operations',
          input: 'Onboard new employee with finance systems access.',
          error: 'Identity provider provisioning failed for one dependent system.',
        },
        workflowState: {
          currentNodeId: onboardingNodes[2]?.instanceId || null,
          executedNodeIds: onboardingNodes.slice(0, 3).map((node) => String(node.instanceId)),
          pendingNodeIds: onboardingNodes.slice(3).map((node) => String(node.instanceId)),
          lastError: 'Provisioning gateway unavailable',
        },
      }),
      error_message: 'Provisioning gateway unavailable',
    },
    {
      id: 'run-browser-meeting-1',
      workflow_id: 'wf-browser-meeting',
      status: 'COMPLETED',
      started_at: meetingRunStartedAt,
      completed_at: minutesAgoIso(91),
      trigger_source: 'browser',
      context: JSON.stringify({
        workflowId: 'wf-browser-meeting',
        workflowName: workflowById.get('wf-browser-meeting')?.name,
        task: {
          title: 'Publish Q4 planning action items',
          owner: 'Program Office',
          priority: 'medium',
          status: 'completed',
        },
        metadata: {
          agentId: 'meeting',
          agentName: 'Meeting Intelligence',
          input: 'Analyze the weekly operating review transcript.',
          notifications: ['Meeting summary delivered to operations channel.'],
        },
        workflowState: {
          currentNodeId: meetingNodes[meetingNodes.length - 1]?.instanceId || null,
          executedNodeIds: meetingNodes.map((node) => String(node.instanceId)),
          pendingNodeIds: [],
        },
      }),
      error_message: null,
    },
    {
      id: 'run-browser-invoice-1',
      workflow_id: 'wf-browser-invoice',
      status: 'COMPLETED',
      started_at: invoiceRunStartedAt,
      completed_at: minutesAgoIso(176),
      trigger_source: 'browser',
      context: JSON.stringify({
        workflowId: 'wf-browser-invoice',
        workflowName: workflowById.get('wf-browser-invoice')?.name,
        task: {
          title: 'Review invoice INV-2024-441',
          owner: 'AP Lead',
          priority: 'medium',
          status: 'completed',
        },
        metadata: {
          agentId: 'invoice',
          agentName: 'Invoice Processor',
          input: 'Process invoice INV-2024-441 for CloudSphere LLC.',
          notifications: ['Invoice approved and queued for payment.'],
        },
        workflowState: {
          currentNodeId: invoiceNodes[invoiceNodes.length - 1]?.instanceId || null,
          executedNodeIds: invoiceNodes.map((node) => String(node.instanceId)),
          pendingNodeIds: [],
        },
      }),
      error_message: null,
    },
  ];

  const approvals: BrowserApprovalRecord[] = [
    {
      id: 'approval-browser-security-1',
      workflow_run_id: 'run-browser-security-1',
      workflow_id: 'wf-browser-security',
      workflow_name: workflowById.get('wf-browser-security')?.name || 'Security Incident Response',
      node_id: String(securityApprovalNode.instanceId || 'security-approval'),
      node_name: String(securityApprovalNode.name || 'Authorize Containment'),
      title: String(((securityApprovalNode.config as JsonRecord | undefined) || {}).title || 'Security Containment'),
      description: 'Approve immediate endpoint isolation and credential rotation.',
      context: { workflowName: workflowById.get('wf-browser-security')?.name || 'Security Incident Response' },
      assigned_to: 'security.lead',
      priority: 'critical',
      deadline: resolveDeadline(securityRunStartedAt, ((securityApprovalNode.config as JsonRecord | undefined) || {}).deadline),
      escalation_policy: 'Escalate to CISO after 30 minutes.',
      status: 'PENDING',
      decision_comment: null,
      created_at: minutesAgoIso(17),
      resolved_at: null,
      resolved_by: null,
    },
    {
      id: 'approval-browser-invoice-1',
      workflow_run_id: 'run-browser-invoice-1',
      workflow_id: 'wf-browser-invoice',
      workflow_name: workflowById.get('wf-browser-invoice')?.name || 'Invoice Approval Workflow',
      node_id: String(invoiceApprovalNode.instanceId || 'invoice-approval'),
      node_name: String(invoiceApprovalNode.name || 'Manager Approval'),
      title: String(((invoiceApprovalNode.config as JsonRecord | undefined) || {}).title || 'Invoice Approval'),
      description: 'Verified invoice amount is within threshold and vendor is approved.',
      context: { workflowName: workflowById.get('wf-browser-invoice')?.name || 'Invoice Approval Workflow' },
      assigned_to: 'finance.lead',
      priority: 'high',
      deadline: resolveDeadline(invoiceRunStartedAt, ((invoiceApprovalNode.config as JsonRecord | undefined) || {}).deadline),
      escalation_policy: 'Escalate to finance director after 24 hours.',
      status: 'APPROVED',
      decision_comment: 'Vendor and threshold checks passed.',
      decision_data: { decision: 'APPROVED' },
      created_at: minutesAgoIso(179),
      resolved_at: minutesAgoIso(177),
      resolved_by: 'finance.lead',
    },
  ];

  const workflowLogs: BrowserWorkflowLog[] = [
    ...invoiceNodes.map((node, index) => ({
      id: uuid(),
      run_id: 'run-browser-invoice-1',
      node_id: String(node.instanceId),
      node_type: String(node.nodeType),
      status: 'completed',
      duration_ms: [140, 220, 360, 120][index] || 180,
      error: null,
      timestamp: minutesAgoIso(179 - index),
    })),
    ...meetingNodes.map((node, index) => ({
      id: uuid(),
      run_id: 'run-browser-meeting-1',
      node_id: String(node.instanceId),
      node_type: String(node.nodeType),
      status: 'completed',
      duration_ms: [90, 620, 280, 140][index] || 160,
      error: null,
      timestamp: minutesAgoIso(94 - index),
    })),
    ...onboardingNodes.map((node, index) => ({
      id: uuid(),
      run_id: 'run-browser-onboarding-1',
      node_id: String(node.instanceId),
      node_type: String(node.nodeType),
      status: index === 2 ? 'failed' : 'completed',
      duration_ms: [110, 180, 980, 0, 0][index] || 0,
      error: index === 2 ? 'Provisioning gateway unavailable' : null,
      timestamp: minutesAgoIso(57 - index),
    })),
    ...securityNodes.map((node, index) => ({
      id: uuid(),
      run_id: 'run-browser-security-1',
      node_id: String(node.instanceId),
      node_type: String(node.nodeType),
      status: index === 2 ? 'waiting' : index < 2 ? 'completed' : 'pending',
      duration_ms: [130, 540, 0, 0][index] || 0,
      error: null,
      timestamp: minutesAgoIso(18 - index),
    })),
  ];

  const auditEntries: BrowserAuditEntry[] = [
    {
      id: uuid(),
      agent_id: 'security',
      event_type: 'APPROVAL_REQUESTED',
      event: 'Security containment is waiting for human approval.',
      decision: 'PENDING_APPROVAL',
      input_preview: 'Critical endpoint activity triggered isolation workflow.',
      processing_time_ms: 670,
      metadata: serializeMetadata({ workflowId: 'wf-browser-security', workflowName: workflowById.get('wf-browser-security')?.name }),
      timestamp: minutesAgoIso(17),
    },
    {
      id: uuid(),
      agent_id: 'security',
      event_type: 'AGENT_RUN',
      event: 'Executed Security Monitor',
      decision: 'ESCALATE',
      input_preview: 'Critical EDR alert detected on finance workstation.',
      processing_time_ms: 920,
      metadata: serializeMetadata({ workflowPlan: ['wf-browser-security'], status: 'WAITING_APPROVAL' }),
      timestamp: minutesAgoIso(18),
    },
    {
      id: uuid(),
      agent_id: 'hr_ops',
      event_type: 'WORKFLOW_FAILED',
      event: 'Employee onboarding automation failed during access provisioning.',
      decision: 'FLAG',
      input_preview: 'Identity provider provisioning failed for a dependent system.',
      processing_time_ms: 980,
      metadata: serializeMetadata({ workflowId: 'wf-browser-onboarding', error: 'Provisioning gateway unavailable' }),
      timestamp: minutesAgoIso(51),
    },
    {
      id: uuid(),
      agent_id: 'meeting',
      event_type: 'AGENT_RUN',
      event: 'Executed Meeting Intelligence',
      decision: 'PROCEED',
      input_preview: 'Q4 planning transcript summarized into actions and risks.',
      processing_time_ms: 640,
      metadata: serializeMetadata({ workflowId: 'wf-browser-meeting', status: 'COMPLETED' }),
      timestamp: minutesAgoIso(91),
    },
    {
      id: uuid(),
      agent_id: 'invoice',
      event_type: 'APPROVAL_APPROVED',
      event: 'Invoice approval completed and payment processing continued.',
      decision: 'APPROVED',
      input_preview: 'Vendor verification and amount thresholds passed.',
      processing_time_ms: 210,
      metadata: serializeMetadata({ workflowId: 'wf-browser-invoice', workflowName: workflowById.get('wf-browser-invoice')?.name }),
      timestamp: minutesAgoIso(177),
    },
    {
      id: uuid(),
      agent_id: 'invoice',
      event_type: 'AGENT_RUN',
      event: 'Executed Invoice Processor',
      decision: 'PROCEED',
      input_preview: 'Process invoice INV-2024-441 for CloudSphere LLC.',
      processing_time_ms: 780,
      metadata: serializeMetadata({ workflowId: 'wf-browser-invoice', status: 'COMPLETED' }),
      timestamp: minutesAgoIso(176),
    },
  ];

  const agentWorkflowLinks = [
    { agent_id: 'invoice', workflow_id: 'wf-browser-invoice', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'finance_ops', workflow_id: 'wf-browser-invoice', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'meeting', workflow_id: 'wf-browser-meeting', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'workflow', workflow_id: 'wf-browser-meeting', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'hr_ops', workflow_id: 'wf-browser-onboarding', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'compliance', workflow_id: 'wf-browser-onboarding', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'security', workflow_id: 'wf-browser-security', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'it_ops', workflow_id: 'wf-browser-security', can_trigger: 1, can_modify: 0, created_at: now },
    { agent_id: 'workflow', workflow_id: 'wf-browser-security', can_trigger: 1, can_modify: 0, created_at: now },
  ];

  return {
    agents,
    workflows,
    approvals,
    auditEntries,
    runs,
    workflowLogs,
    versions: [],
    agentWorkflowLinks,
    templates: BROWSER_WORKFLOW_TEMPLATES,
  };
}

function readStore(): BrowserStoreShape {
  const seeded = buildDefaultStore();
  const store = readLocalStorage<BrowserStoreShape>(STORE_KEY, seeded);
  const shouldHydrateDemoData = !Array.isArray(store.workflows) || store.workflows.length === 0;

  return {
    ...seeded,
    ...store,
    workflows: shouldHydrateDemoData ? seeded.workflows : store.workflows,
    approvals: shouldHydrateDemoData ? seeded.approvals : store.approvals,
    auditEntries: shouldHydrateDemoData ? seeded.auditEntries : store.auditEntries,
    runs: shouldHydrateDemoData ? seeded.runs : store.runs,
    workflowLogs: shouldHydrateDemoData ? seeded.workflowLogs : (store.workflowLogs || seeded.workflowLogs),
    agentWorkflowLinks: shouldHydrateDemoData ? seeded.agentWorkflowLinks : store.agentWorkflowLinks,
    templates: BROWSER_WORKFLOW_TEMPLATES,
  };
}

function writeStore(store: BrowserStoreShape): void {
  writeLocalStorage(STORE_KEY, store);
}

function responseJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function addAuditEntry(
  store: BrowserStoreShape,
  eventType: string,
  event: string,
  agentId = 'system',
  options?: { decision?: string; inputPreview?: string; processingTimeMs?: number; metadata?: Record<string, unknown> }
) {
  store.auditEntries.unshift({
    id: uuid(),
    agent_id: agentId,
    event_type: eventType,
    event,
    decision: options?.decision || null,
    input_preview: options?.inputPreview || null,
    processing_time_ms: options?.processingTimeMs || null,
    metadata: serializeMetadata(options?.metadata),
    timestamp: new Date().toISOString(),
  });
  store.auditEntries = store.auditEntries.slice(0, 200);
}

function parseBody(init?: RequestInit): JsonRecord {
  if (!init?.body || typeof init.body !== 'string') {
    return {};
  }

  try {
    return JSON.parse(init.body) as JsonRecord;
  } catch {
    return {};
  }
}

function buildMetrics(store: BrowserStoreShape): JsonRecord {
  const runs = [...store.runs].sort((left, right) => Date.parse(String(right.started_at)) - Date.parse(String(left.started_at)));
  const approvals = [...store.approvals].sort((left, right) => Date.parse(String(right.created_at)) - Date.parse(String(left.created_at)));
  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const workflowById = new Map(store.workflows.map((workflow) => [workflow.id, workflow]));
  const workflowStatusBreakdown = {
    PENDING: 0,
    RUNNING: 0,
    WAITING_APPROVAL: 0,
    FAILED: 0,
    COMPLETED: 0,
  };
  const decisionBreakdown = { ...emptyDecisionBreakdown };
  const agentRunCounts: Record<string, number> = {};
  let totalDurationMs = 0;
  let completedDurationCount = 0;
  let totalTasksCreated = 0;

  store.auditEntries.forEach((entry) => {
    const decision = String(entry.decision || '').toUpperCase();
    if (!decision) {
      return;
    }
    if (decision.includes('AUTO_APPROVE') || decision.includes('AUTO-APPROVE')) decisionBreakdown.autoApprove += 1;
    else if (decision.includes('APPROVED')) decisionBreakdown.approved += 1;
    else if (decision.includes('FLAG')) decisionBreakdown.flag += 1;
    else if (decision.includes('REJECT')) decisionBreakdown.reject += 1;
    else if (decision.includes('PROCEED')) decisionBreakdown.proceed += 1;
    else if (decision.includes('HOLD') || decision.includes('PENDING_APPROVAL')) decisionBreakdown.hold += 1;
    else if (decision.includes('ESCALATE')) decisionBreakdown.escalate += 1;
    else decisionBreakdown.other += 1;
  });

  const recentRuns = runs.slice(0, 12).map((run) => {
    const context = safeParseJson<Record<string, unknown>>(run.context, {});
    const workflowState = (context.workflowState || {}) as Record<string, unknown>;
    const metadata = (context.metadata || {}) as Record<string, unknown>;
    const executedNodeIds = Array.isArray(workflowState.executedNodeIds) ? (workflowState.executedNodeIds as unknown[]) : [];
    const pendingNodeIds = Array.isArray(workflowState.pendingNodeIds) ? (workflowState.pendingNodeIds as unknown[]) : [];
    const totalKnownNodes = executedNodeIds.length + pendingNodeIds.length;
    const startedAt = new Date(String(run.started_at || new Date().toISOString())).getTime();
    const completedAtRaw = run.completed_at ? new Date(String(run.completed_at)).getTime() : null;
    const elapsedMs = Math.max(0, (completedAtRaw || now) - startedAt);
    const approval = approvals.find((item) => String(item.workflow_run_id) === String(run.id) && String(item.status) === 'PENDING');
    const approvalDeadline = approval?.deadline ? new Date(String(approval.deadline)).getTime() : null;
    const targetMinutes = approvalDeadline && Number.isFinite(approvalDeadline)
      ? Math.max(1, Math.round((approvalDeadline - startedAt) / 60000))
      : null;
    const task = (context.task || {}) as Record<string, unknown>;
    const workflow = workflowById.get(run.workflow_id);
    const status = String(run.status || 'PENDING').toUpperCase() as keyof typeof workflowStatusBreakdown;
    const agentId = String(metadata.agentId || metadata.agent_id || '');

    if (task.title) {
      totalTasksCreated += 1;
    }
    if (workflowStatusBreakdown[status] !== undefined) {
      workflowStatusBreakdown[status] += 1;
    }
    if (agentId) {
      agentRunCounts[agentId] = (agentRunCounts[agentId] || 0) + 1;
    }
    if (run.completed_at) {
      totalDurationMs += elapsedMs;
      completedDurationCount += 1;
    }

    return {
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: workflow?.name || run.workflow_id,
      category: workflow?.category || 'General',
      status: run.status,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      currentNodeId: workflowState.currentNodeId || null,
      progress: totalKnownNodes > 0 ? Math.round((executedNodeIds.length / totalKnownNodes) * 100) : run.status === 'COMPLETED' ? 100 : 0,
      elapsedMs,
      errorMessage: run.error_message || workflowState.lastError || null,
      approvalDeadline: approval?.deadline || null,
      approvalPriority: approval?.priority || null,
      slaConsumedPct: targetMinutes ? Math.round((elapsedMs / (targetMinutes * 60000)) * 100) : null,
      slaTarget: formatDurationLabel(targetMinutes),
    };
  });

  const bottlenecks = Array.from(
    store.workflowLogs.reduce((groups, log) => {
      const key = `${String(log.node_type || 'unknown')}::${String(log.node_id || 'unknown')}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(log);
      return groups;
    }, new Map<string, BrowserWorkflowLog[]>())
  )
    .map(([key, entries]) => {
      const [nodeType, nodeId] = key.split('::');
      const durations = entries.map((entry) => Number(entry.duration_ms || 0)).filter((value) => value > 0);
      const failures = entries.filter((entry) => String(entry.status) === 'failed').length;
      const avgMs = durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
      return {
        nodeId,
        nodeType,
        avgMs,
        p95Ms: getP95(durations),
        failureCount: failures,
        totalExecutions: entries.length,
        severity: failures > 0 || avgMs > 12000 ? 'critical' : avgMs > 6000 ? 'warning' : 'normal',
      };
    })
    .sort((left, right) => right.avgMs - left.avgMs)
    .slice(0, 8);

  const pendingApprovals = approvals.filter((approval) => String(approval.status) === 'PENDING').length;
  const alerts = [
    ...approvals
      .filter((approval) => String(approval.status) === 'PENDING' && String(approval.priority) === 'critical')
      .slice(0, 4)
      .map((approval) => ({
        level: 'critical',
        title: `Critical approval waiting: ${approval.title || approval.workflow_name}`,
        detail: `Assigned to ${approval.assigned_to || 'admin'} for workflow ${approval.workflow_name}.`,
        timestamp: approval.created_at,
        source: 'approval',
      })),
    ...recentRuns
      .filter((run) => String(run.status) === 'FAILED')
      .slice(0, 4)
      .map((run) => ({
        level: 'warning',
        title: `Workflow failed: ${run.workflowName}`,
        detail: String(run.errorMessage || 'Workflow execution failed.'),
        timestamp: run.startedAt,
        source: 'workflow',
      })),
    ...recentRuns
      .filter((run) => String(run.status) === 'WAITING_APPROVAL')
      .slice(0, 4)
      .map((run) => ({
        level: 'info',
        title: `Workflow paused for approval: ${run.workflowName}`,
        detail: `Awaiting human decision${run.approvalPriority ? ` (${run.approvalPriority})` : ''}.`,
        timestamp: run.startedAt,
        source: 'workflow',
      })),
  ].slice(0, 10);

  return {
    totalRuns: runs.length,
    totalWorkflowsRun: runs.length,
    totalTasksCreated,
    totalDecisionsMade: store.auditEntries.filter((entry) => String(entry.decision || '').trim().length > 0).length,
    avgProcessingTimeMs: completedDurationCount > 0 ? Math.round(totalDurationMs / completedDurationCount) : 0,
    activeAgents: store.agents.filter((agent) => agent.status === 'active').length,
    agentsActive: store.agents.filter((agent) => agent.status === 'active').length,
    workflows: store.workflows.length,
    pendingApprovals,
    failedToday: runs.filter((run) => String(run.status) === 'FAILED' && new Date(String(run.started_at)).getTime() >= startOfDay.getTime()).length,
    criticalAlerts: alerts.filter((alert) => alert.level === 'critical').length,
    workflowStatusBreakdown,
    decisionBreakdown,
    recentRuns,
    bottlenecks,
    alerts,
    slaTrackers: recentRuns
      .filter((run) => String(run.status) === 'RUNNING' || String(run.status) === 'WAITING_APPROVAL')
      .map((run) => ({
        name: run.workflowName,
        consumed: run.slaConsumedPct,
        target: run.slaTarget,
        status: run.status,
      })),
    lastUpdated: new Date().toISOString(),
    agentRunCounts,
    escalationsTriggered: decisionBreakdown.escalate,
  };
}

function buildHealth(store: BrowserStoreShape): JsonRecord {
  const metrics = buildMetrics(store);
  const workflowStatusBreakdown = (metrics.workflowStatusBreakdown || {}) as Record<string, number>;
  const pendingApprovals = Number(metrics.pendingApprovals || 0);
  const oldestRunStart = store.runs.reduce<number | null>((oldest, run) => {
    const startedAt = Date.parse(String(run.started_at || ''));
    if (!Number.isFinite(startedAt)) {
      return oldest;
    }
    return oldest === null ? startedAt : Math.min(oldest, startedAt);
  }, null);
  const uptimeSeconds = oldestRunStart ? Math.max(1, Math.round((Date.now() - oldestRunStart) / 1000)) : 3600;

  return {
    status: 'ok',
    uptimeSeconds,
    agentsActive: Number(metrics.activeAgents || 0),
    totalRuns: Number(metrics.totalRuns || 0),
    storageMode: 'browser',
    persistence: 'localStorage',
    model: 'browser-local',
    services: [
      {
        name: 'Niyanta Orchestrator',
        status: 'UP',
        detail: `${Number(metrics.activeAgents || 0)} active agents under orchestration`,
      },
      {
        name: 'Workflow Engine',
        status: 'UP',
        detail: `${Number(metrics.totalRuns || 0)} total workflow runs tracked`,
      },
      {
        name: 'Browser Storage',
        status: 'UP',
        detail: `Persisted locally in ${STORE_KEY}`,
      },
      {
        name: 'Demo Data Runtime',
        status: Number(metrics.totalRuns || 0) > 0 ? 'UP' : 'DEGRADED',
        detail: Number(metrics.totalRuns || 0) > 0 ? 'Seeded workflows and approvals are ready' : 'No demo workflows seeded',
      },
      {
        name: 'Approval Queue',
        status: pendingApprovals > 0 ? 'DEGRADED' : 'UP',
        detail: `${pendingApprovals} pending approval${pendingApprovals === 1 ? '' : 's'}`,
      },
      {
        name: 'Browser AI Runtime',
        status: 'UP',
        detail: 'Local heuristic routing for browser demo mode',
      },
    ],
    workflowStatusBreakdown,
    pendingApprovals,
    agents: store.agents.length,
    workflows: store.workflows.length,
    approvals: pendingApprovals,
    timestamp: new Date().toISOString(),
  };
}

function parseJsonArray<T>(value: string): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

function normalizeNodeType(value: unknown): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function createApprovalRecord(
  node: Record<string, unknown>,
  workflow: BrowserWorkflowRecord,
  workflowRunId: string,
  now: string
): BrowserApprovalRecord {
  const config = ((node.config as JsonRecord | undefined) || {}) as JsonRecord;
  return {
    id: uuid(),
    workflow_run_id: workflowRunId,
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    node_id: String(node.instanceId || uuid()),
    node_name: String(node.name || 'Approval Node'),
    title: String(config.title || 'Approval Required'),
    description: String(config.description || 'Review this approval request'),
    context: { workflowName: workflow.name },
    assigned_to: String(config.assignedTo || 'admin'),
    priority: (String(config.priority || 'medium') as BrowserApprovalRecord['priority']),
    deadline: resolveDeadline(now, config.deadline),
    escalation_policy: typeof config.escalationPolicy === 'string' ? String(config.escalationPolicy) : null,
    status: 'PENDING',
    decision_comment: null,
    created_at: now,
    resolved_at: null,
    resolved_by: null,
  };
}

function createWorkflowVersionSnapshot(
  store: BrowserStoreShape,
  workflow: BrowserWorkflowRecord,
  changeSummary: string,
  createdBy: string
): BrowserVersionRecord {
  const maxVersion = store.versions
    .filter((version) => version.workflow_id === workflow.id)
    .reduce((max, version) => Math.max(max, version.version_number), 0);

  const snapshot: BrowserVersionRecord = {
    id: uuid(),
    workflow_id: workflow.id,
    version_number: maxVersion + 1,
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes,
    edges: workflow.edges,
    status: workflow.status,
    category: workflow.category,
    tags: workflow.tags,
    triggers: workflow.triggers,
    change_summary: changeSummary,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };

  store.versions.unshift(snapshot);
  return snapshot;
}

function buildWorkflowComparison(version1: BrowserVersionRecord, version2: BrowserVersionRecord) {
  const nodes1 = parseJsonArray<Record<string, unknown>>(version1.nodes);
  const nodes2 = parseJsonArray<Record<string, unknown>>(version2.nodes);
  const edges1 = parseJsonArray<Record<string, unknown>>(version1.edges);
  const edges2 = parseJsonArray<Record<string, unknown>>(version2.edges);

  const nodeIds1 = new Set(nodes1.map((node) => String(node.instanceId)));
  const nodeIds2 = new Set(nodes2.map((node) => String(node.instanceId)));
  const addedNodes = nodes2.filter((node) => !nodeIds1.has(String(node.instanceId)));
  const removedNodes = nodes1.filter((node) => !nodeIds2.has(String(node.instanceId)));
  const modifiedNodes = nodes2.filter((node) => {
    const previous = nodes1.find((candidate) => String(candidate.instanceId) === String(node.instanceId));
    return previous && JSON.stringify(previous) !== JSON.stringify(node);
  });

  const edgeIds1 = new Set(edges1.map((edge) => `${String(edge.fromNodeId)}-${String(edge.toNodeId)}`));
  const edgeIds2 = new Set(edges2.map((edge) => `${String(edge.fromNodeId)}-${String(edge.toNodeId)}`));
  const addedEdges = edges2.filter((edge) => !edgeIds1.has(`${String(edge.fromNodeId)}-${String(edge.toNodeId)}`));
  const removedEdges = edges1.filter((edge) => !edgeIds2.has(`${String(edge.fromNodeId)}-${String(edge.toNodeId)}`));

  return {
    version1: {
      number: version1.version_number,
      name: version1.name,
      createdAt: version1.created_at,
      nodeCount: nodes1.length,
      edgeCount: edges1.length,
    },
    version2: {
      number: version2.version_number,
      name: version2.name,
      createdAt: version2.created_at,
      nodeCount: nodes2.length,
      edgeCount: edges2.length,
    },
    differences: {
      nodes: {
        added: addedNodes.length,
        removed: removedNodes.length,
        modified: modifiedNodes.length,
        details: {
          added: addedNodes.map((node) => ({ id: node.instanceId, name: node.name, type: node.nodeType })),
          removed: removedNodes.map((node) => ({ id: node.instanceId, name: node.name, type: node.nodeType })),
          modified: modifiedNodes.map((node) => ({ id: node.instanceId, name: node.name, type: node.nodeType })),
        },
      },
      edges: {
        added: addedEdges.length,
        removed: removedEdges.length,
        details: {
          added: addedEdges,
          removed: removedEdges,
        },
      },
      metadata: {
        nameChanged: version1.name !== version2.name,
        descriptionChanged: version1.description !== version2.description,
        statusChanged: version1.status !== version2.status,
        categoryChanged: version1.category !== version2.category,
      },
    },
  };
}

function normalizeCanvasLayout(canvasLayout: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(canvasLayout)) {
    return [];
  }

  return canvasLayout
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({ ...(item as Record<string, unknown>) }));
}

function parseCanvasEdges(layout: Array<Record<string, unknown>>) {
  const edgeMeta = layout.find((item) => item.refId === '__edges__');
  if (!edgeMeta?.inputInfo || typeof edgeMeta.inputInfo !== 'string') {
    return [] as Array<{ from: string; to: string }>;
  }

  try {
    const rawEdges = JSON.parse(edgeMeta.inputInfo);
    if (!Array.isArray(rawEdges)) {
      return [];
    }

    return rawEdges
      .map((edge) => ({
        from: String((edge as Record<string, unknown>).from || (edge as Record<string, unknown>).fromNodeId || ''),
        to: String((edge as Record<string, unknown>).to || (edge as Record<string, unknown>).toNodeId || ''),
      }))
      .filter((edge) => edge.from && edge.to && edge.from !== edge.to);
  } catch {
    return [];
  }
}

function extractWorkflowIdsFromCanvas(layout: Array<Record<string, unknown>>): string[] {
  const canvasNodes = layout.filter((item) => item.refId !== '__edges__');
  const nodesById = new Map(canvasNodes.map((item) => [String(item.id || item.refId || ''), item]));
  const adjacency = new Map<string, string[]>();

  parseCanvasEdges(layout).forEach((edge) => {
    const targets = adjacency.get(edge.from) || [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);
  });

  const queue = ['__start__'];
  const visited = new Set<string>();
  const workflowIds: string[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const node = nodesById.get(nodeId);
    if (node?.blockType === 'workflow' && node.refId && !['__start__', '__end__'].includes(String(node.refId)) && !workflowIds.includes(String(node.refId))) {
      workflowIds.push(String(node.refId));
    }

    (adjacency.get(nodeId) || []).forEach((nextNodeId) => {
      if (!visited.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }

  return workflowIds;
}

function validateAgentCanvasLayout(canvasLayout: unknown) {
  const normalizedLayout = normalizeCanvasLayout(canvasLayout);
  if (normalizedLayout.length === 0) {
    return { valid: true, normalizedLayout, workflowIds: [] as string[] };
  }

  const nodes = normalizedLayout.filter((item) => item.refId !== '__edges__');
  const workflowBlocks = nodes.filter((item) => item.blockType === 'workflow' && item.refId !== '__start__' && item.refId !== '__end__');
  const validNodeIds = new Set(nodes.map((item) => String(item.id || item.refId || '')));
  validNodeIds.add('__start__');
  validNodeIds.add('__end__');

  const edges = parseCanvasEdges(normalizedLayout);
  const hasInvalidEdge = edges.some((edge) => !validNodeIds.has(edge.from) || !validNodeIds.has(edge.to));
  if (hasInvalidEdge) {
    return {
      valid: false,
      message: 'The agent canvas contains broken connections. Remove invalid edges and try again.',
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  if (workflowBlocks.length === 0) {
    return {
      valid: false,
      message: 'Add at least one workflow block to the agent canvas before saving.',
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  if (!edges.some((edge) => edge.from === '__start__')) {
    return {
      valid: false,
      message: 'Connect the Input node to your workflow path before saving the agent.',
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  if (!edges.some((edge) => edge.to === '__end__')) {
    return {
      valid: false,
      message: 'Connect at least one block to the Niyanta output node before saving the agent.',
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  const adjacency = new Map<string, string[]>();
  edges.forEach((edge) => {
    const targets = adjacency.get(edge.from) || [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);
  });

  const reachable = new Set<string>();
  const queue = ['__start__'];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachable.has(nodeId)) {
      continue;
    }
    reachable.add(nodeId);
    (adjacency.get(nodeId) || []).forEach((nextNodeId) => {
      if (!reachable.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }

  if (!reachable.has('__end__')) {
    return {
      valid: false,
      message: 'The canvas must form a complete path from Input to Niyanta output.',
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  const disconnectedWorkflow = workflowBlocks.find((block) => !reachable.has(String(block.id || block.refId || '')));
  if (disconnectedWorkflow) {
    return {
      valid: false,
      message: `Workflow block "${String(disconnectedWorkflow.name || disconnectedWorkflow.refId)}" is disconnected from the main execution path.`,
      normalizedLayout,
      workflowIds: [] as string[],
    };
  }

  return {
    valid: true,
    normalizedLayout,
    workflowIds: extractWorkflowIdsFromCanvas(normalizedLayout),
  };
}

function buildWorkflowPlan(store: BrowserStoreShape, agent: BrowserAgentRecord) {
  const canvasLayout = normalizeCanvasLayout(agent.canvas_layout);
  const canvasWorkflowIds = canvasLayout.length > 0 ? extractWorkflowIdsFromCanvas(canvasLayout) : [];
  const linkedWorkflowIds = store.agentWorkflowLinks
    .filter((link) => link.agent_id === agent.id || link.agent_id === agent.agent_id)
    .map((link) => link.workflow_id);
  const orderedWorkflowIds = [...new Set([...canvasWorkflowIds, ...linkedWorkflowIds, ...(agent.workflow_id ? [agent.workflow_id] : [])])];

  return orderedWorkflowIds
    .map((workflowId, index) => {
      const workflow = store.workflows.find((item) => item.id === workflowId);
      if (!workflow) {
        return null;
      }
      return {
        workflowId: workflow.id,
        name: workflow.name,
        reason: canvasWorkflowIds.includes(workflow.id)
          ? 'Selected from the agent canvas execution path.'
          : index === 0
            ? 'Primary workflow linked to the agent.'
            : 'Additional linked workflow candidate.',
      };
    })
    .filter(Boolean) as Array<{ workflowId: string; name: string; reason: string }>;
}

function buildBrowserAnalysis(
  agent: BrowserAgentRecord,
  input: string,
  workflowPlan: Array<{ workflowId: string; name: string; reason: string }>
) {
  const normalizedInput = input.toLowerCase();
  const riskLevel = normalizedInput.includes('critical') || normalizedInput.includes('security')
    ? 'critical'
    : normalizedInput.includes('urgent') || normalizedInput.includes('approval') || normalizedInput.includes('blocked')
      ? 'high'
      : normalizedInput.includes('review') || normalizedInput.includes('risk')
        ? 'medium'
        : 'low';
  const requiresHumanApproval = riskLevel === 'critical' || riskLevel === 'high';

  return {
    summary: `${agent.name} analyzed the request in browser mode and prepared ${workflowPlan.length} workflow step${workflowPlan.length === 1 ? '' : 's'}.`,
    decision: requiresHumanApproval ? 'ESCALATE' : workflowPlan.length > 0 ? 'PROCEED' : 'NO_WORKFLOW',
    riskLevel,
    requiresHumanApproval,
    whyChain: [
      `Input routed locally to ${agent.name}.`,
      workflowPlan.length > 0
        ? `Selected ${workflowPlan.length} workflow candidate${workflowPlan.length === 1 ? '' : 's'} from linked and canvas-configured workflows.`
        : 'No linked workflow was available for this agent.',
      requiresHumanApproval
        ? 'Risk signal requires approval-aware execution in browser mode.'
        : 'Risk signal remained within automated handling thresholds.',
    ],
  };
}

function executeWorkflowLocally(
  store: BrowserStoreShape,
  workflow: BrowserWorkflowRecord,
  initialContext: JsonRecord,
  dryRun: boolean
) {
  const now = new Date().toISOString();
  const runId = `run-${uuid()}`;
  const nodes = parseJsonArray<Record<string, unknown>>(workflow.nodes);
  const approvalIndex = nodes.findIndex((node) => normalizeNodeType(node.nodeType) === 'approval');
  const hasApproval = approvalIndex >= 0;
  const executedNodeIds = (hasApproval ? nodes.slice(0, approvalIndex + 1) : nodes).map((node) => String(node.instanceId));
  const pendingNodeIds = (hasApproval ? nodes.slice(approvalIndex + 1) : []).map((node) => String(node.instanceId));
  const status = hasApproval ? 'WAITING_APPROVAL' : 'COMPLETED';
  const resultContext = {
    ...initialContext,
    workflowId: workflow.id,
    workflowName: workflow.name,
    executedIn: dryRun ? 'browser-dry-run' : 'browser-run',
    nodeCount: nodes.length,
    approvalCount: hasApproval ? 1 : 0,
    workflowState: {
      currentNodeId: hasApproval ? nodes[approvalIndex]?.instanceId || null : nodes[nodes.length - 1]?.instanceId || null,
      executedNodeIds,
      pendingNodeIds,
      lastError: null,
    },
  };

  if (!dryRun) {
    store.runs.unshift({
      id: runId,
      workflow_id: workflow.id,
      status,
      started_at: now,
      completed_at: status === 'COMPLETED' ? now : null,
      trigger_source: 'browser',
      context: JSON.stringify(resultContext),
      error_message: null,
    });

    if (hasApproval) {
      store.approvals.unshift(createApprovalRecord(nodes[approvalIndex], workflow, runId, now));
    }

    store.workflowLogs.unshift(
      ...(hasApproval ? nodes.slice(0, approvalIndex + 1) : nodes).map((node, index) => ({
        id: uuid(),
        run_id: runId,
        node_id: String(node.instanceId || uuid()),
        node_type: String(node.nodeType || 'unknown'),
        status: hasApproval && index === approvalIndex ? 'waiting' : 'completed',
        duration_ms: Math.max(90, 120 + index * 90),
        error: null,
        timestamp: new Date(Date.now() + index * 1000).toISOString(),
      }))
    );

    addAuditEntry(store, 'WORKFLOW_EXECUTE', `Executed workflow ${workflow.name}`, String((initialContext.metadata as JsonRecord | undefined)?.agentId || 'system'), {
      decision: hasApproval ? 'PENDING_APPROVAL' : 'PROCEED',
      inputPreview: String((initialContext.metadata as JsonRecord | undefined)?.input || workflow.name),
      metadata: { workflowId: workflow.id, status },
    });
    writeStore(store);
  }

  return {
    success: true,
    workflowId: workflow.id,
    workflowName: workflow.name,
    runId,
    context: resultContext,
    status,
    waitingForApproval: hasApproval,
    timestamp: now,
    dryRun,
  };
}

function executeAgentLocally(store: BrowserStoreShape, agentId: string, input: string, workflowContext?: JsonRecord) {
  const agent = store.agents.find((item) => item.id === agentId || item.agent_id === agentId);
  if (!agent) {
    return responseJson({ success: false, error: 'InvalidAgent', message: `Unsupported agent: ${agentId}` }, 400);
  }

  const timestamp = new Date().toISOString();
  const workflowPlan = buildWorkflowPlan(store, agent);
  const analysis = buildBrowserAnalysis(agent, input, workflowPlan);
  let sharedContext: JsonRecord = {
    ...(workflowContext || {}),
    task: {
      title: input.trim().slice(0, 48) || `${agent.name} review`,
      owner: 'Admin',
      priority: analysis.riskLevel === 'critical' ? 'critical' : analysis.riskLevel === 'high' ? 'high' : 'medium',
      status: 'open',
    },
    metadata: {
      ...(((workflowContext || {}).metadata as JsonRecord | undefined) || {}),
      input,
      routedAt: timestamp,
      agentId: agent.id,
      agentName: agent.name,
      workflowPlan,
      agentAnalysis: analysis,
      notifications: [],
    },
  };
  const workflowExecutions: Array<Record<string, unknown>> = [];

  for (let index = 0; index < workflowPlan.length; index += 1) {
    const plannedWorkflow = workflowPlan[index];
    const workflow = store.workflows.find((item) => item.id === plannedWorkflow.workflowId);
    if (!workflow) {
      continue;
    }

    const execution = executeWorkflowLocally(store, workflow, sharedContext, false);
    workflowExecutions.push({
      workflowId: execution.workflowId,
      workflowName: execution.workflowName,
      runId: execution.runId,
      success: execution.success,
      status: execution.status,
      waitingForApproval: execution.waitingForApproval,
      reason: plannedWorkflow.reason,
      error: null,
    });

    sharedContext = {
      ...sharedContext,
      ...((execution.context as JsonRecord | undefined) || {}),
      metadata: {
        ...((sharedContext.metadata as JsonRecord | undefined) || {}),
        ...((((execution.context as JsonRecord | undefined) || {}).metadata as JsonRecord | undefined) || {}),
      },
    };

    if (execution.status === 'WAITING_APPROVAL' || !execution.success) {
      break;
    }
  }

  const latestExecution = workflowExecutions[workflowExecutions.length - 1];
  const notifications = Array.isArray((sharedContext.metadata as JsonRecord | undefined)?.notifications)
    ? (((sharedContext.metadata as JsonRecord).notifications) as unknown[])
    : [];
  const result = {
    summary: analysis.summary,
    decision: latestExecution?.status === 'WAITING_APPROVAL' ? 'PENDING_APPROVAL' : analysis.decision,
    riskLevel: analysis.riskLevel,
    requiresHumanApproval: analysis.requiresHumanApproval || latestExecution?.status === 'WAITING_APPROVAL',
    escalate_to_human: analysis.requiresHumanApproval || latestExecution?.status === 'WAITING_APPROVAL',
    workflowPlan,
    workflowExecutions,
    sharedContext,
    tasks: sharedContext.task ? [sharedContext.task] : [],
    notifications,
    whyChain: analysis.whyChain,
    status: String(latestExecution?.status || (workflowPlan.length > 0 ? 'COMPLETED' : 'NO_WORKFLOW')),
    nextWorkflow:
      latestExecution && latestExecution.success !== false && latestExecution.status !== 'WAITING_APPROVAL'
        ? workflowPlan[workflowExecutions.length]?.name || null
        : null,
  };
  const processingTime = 120 + workflowExecutions.length * 160;

  addAuditEntry(store, 'AGENT_RUN', `Executed ${agent.name}`, agentId, {
    decision: String(result.decision || 'PROCEED'),
    inputPreview: input.trim().slice(0, 300),
    processingTimeMs: processingTime,
    metadata: {
      workflowPlan,
      workflowExecutionCount: workflowExecutions.length,
      status: result.status,
    },
  });
  writeStore(store);
  return responseJson({
    success: true,
    sessionId: uuid(),
    agentId,
    result,
    processingTime,
    model: 'browser-local',
    timestamp,
  });
}

function filterTemplates(url: URL) {
  const category = url.searchParams.get('category');
  const complexity = url.searchParams.get('complexity');

  return BROWSER_WORKFLOW_TEMPLATES.filter((template) => {
    if (category && template.category !== category) {
      return false;
    }
    if (complexity && template.complexity !== complexity) {
      return false;
    }
    return true;
  });
}

function handleTemplates(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  if (method === 'GET' && url.pathname === '/api/templates') {
    return responseJson({ success: true, templates: filterTemplates(url) });
  }

  const instantiateMatch = url.pathname.match(/^\/api\/templates\/([^/]+)\/instantiate$/);
  if (method === 'POST' && instantiateMatch) {
    const templateId = decodeURIComponent(instantiateMatch[1]);
    const template = BROWSER_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return responseJson({ success: false, message: 'Template not found' }, 404);
    }

    const body = parseBody(init);
    const workflowSeed = instantiateBrowserTemplate(template, (body.customName as string) || template.name);
    const now = new Date().toISOString();
    const workflowId = uuid();
    const workflow: BrowserWorkflowRecord = {
      id: workflowId,
      name: workflowSeed.name,
      description: workflowSeed.description,
      nodes: JSON.stringify(workflowSeed.nodes),
      edges: JSON.stringify(workflowSeed.edges),
      status: 'draft',
      category: workflowSeed.category,
      tags: JSON.stringify(workflowSeed.tags),
      triggers: JSON.stringify(workflowSeed.triggers),
      allow_agent_invocation: 1,
      is_default: 0,
      is_agent: 0,
      created_at: now,
      updated_at: now,
    };

    store.workflows.unshift(workflow);
    addAuditEntry(store, 'template.instantiate', `Instantiated template ${template.name}`);
    writeStore(store);
    return responseJson({ success: true, workflowId, workflow });
  }

  return null;
}

function handleAgents(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  if (method === 'POST' && url.pathname === '/api/agent/run') {
    const body = parseBody(init);
    return executeAgentLocally(
      store,
      String(body.agentId || ''),
      String(body.input || ''),
      ((body.workflowContext as JsonRecord | undefined) || {}) as JsonRecord
    );
  }

  if (method === 'GET' && url.pathname === '/api/agent/list') {
    return responseJson({ agents: store.agents });
  }

  if (method === 'POST' && url.pathname === '/api/agent') {
    const body = parseBody(init);
    const now = new Date().toISOString();
    const agentId = `agent_${uuid().slice(0, 8)}`;
    const canvasValidation = validateAgentCanvasLayout((body.config as JsonRecord | undefined)?.canvasLayout);
    if ((body.config as JsonRecord | undefined)?.canvasLayout !== undefined && !canvasValidation.valid) {
      return responseJson({ success: false, error: 'InvalidCanvasLayout', message: (canvasValidation as { message?: string }).message }, 400);
    }
    const linkedWorkflows = Array.isArray(body.workflows) && (body.workflows as string[]).length > 0
      ? (body.workflows as string[])
      : canvasValidation.workflowIds;
    const capabilities = Array.isArray(body.capabilities)
      ? (body.capabilities as string[])
      : typeof body.capabilities === 'string'
        ? String(body.capabilities).split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const agent: BrowserAgentRecord = {
      id: agentId,
      agent_id: agentId,
      name: String(body.name || 'Untitled Agent'),
      subtitle: String(body.subtitle || ''),
      icon: String(body.icon || String(body.name || 'AG').slice(0, 2).toUpperCase()),
      color: String(body.color || '#64748b'),
      glow: 'rgba(100,116,139,0.2)',
      description: String(body.description || ''),
      capabilities,
      status: 'active',
      system_prompt: String(body.systemPrompt || `You are ${String(body.name || 'an agent')}.`),
      is_template: 0,
      is_default: 0,
      canvas_layout: canvasValidation.normalizedLayout,
      created_at: now,
    };

    store.agents.unshift(agent);
    linkedWorkflows.forEach((workflowId) => {
      store.agentWorkflowLinks.push({
        agent_id: agentId,
        workflow_id: workflowId,
        can_trigger: 1,
        can_modify: 0,
        created_at: now,
      });
    });
    addAuditEntry(store, 'AGENT_CREATE', `Created agent ${agent.name}`, agentId, {
      metadata: { linkedWorkflows },
    });
    writeStore(store);
    return responseJson({ success: true, agent }, 201);
  }

  const agentWorkflowsMatch = url.pathname.match(/^\/api\/agent\/([^/]+)\/workflows$/);
  if (agentWorkflowsMatch) {
    const agentId = decodeURIComponent(agentWorkflowsMatch[1]);

    if (method === 'GET') {
      const workflows = store.agentWorkflowLinks
        .filter((link) => link.agent_id === agentId)
        .map((link) => {
          const workflow = store.workflows.find((item) => item.id === link.workflow_id);
          return workflow
            ? {
                workflow_id: workflow.id,
                can_trigger: link.can_trigger,
                can_modify: link.can_modify,
                created_at: link.created_at,
                name: workflow.name,
                description: workflow.description,
                category: workflow.category,
                status: workflow.status,
              }
            : null;
        })
        .filter(Boolean);

      const agent = store.agents.find((item) => item.id === agentId || item.agent_id === agentId);
      return responseJson({ success: true, workflows, canvasLayout: agent?.canvas_layout || [] });
    }

    if (method === 'POST') {
      const body = parseBody(init);
      const workflowIds = Array.isArray(body.workflowIds) ? (body.workflowIds as string[]) : [];
      const action = String(body.action || 'add');
      const now = new Date().toISOString();

      if (action === 'add') {
        workflowIds.forEach((workflowId) => {
          if (!store.agentWorkflowLinks.find((link) => link.agent_id === agentId && link.workflow_id === workflowId)) {
            store.agentWorkflowLinks.push({ agent_id: agentId, workflow_id: workflowId, can_trigger: 1, can_modify: 0, created_at: now });
          }
        });
      } else {
        store.agentWorkflowLinks = store.agentWorkflowLinks.filter(
          (link) => !(link.agent_id === agentId && workflowIds.includes(link.workflow_id))
        );
      }

      addAuditEntry(store, 'agent.workflows', `${action} workflows for agent ${agentId}`, agentId);
      writeStore(store);
      return responseJson({ success: true, message: `Workflows ${action === 'add' ? 'linked' : 'unlinked'} successfully` });
    }
  }

  const agentItemMatch = url.pathname.match(/^\/api\/agent\/([^/]+)$/);
  if (agentItemMatch) {
    const agentId = decodeURIComponent(agentItemMatch[1]);
    const agentIndex = store.agents.findIndex((item) => item.id === agentId || item.agent_id === agentId);
    if (agentIndex === -1) {
      return responseJson({ success: false, message: 'Agent not found' }, 404);
    }

    if (method === 'PUT') {
      const body = parseBody(init);
      const existing = store.agents[agentIndex];
      const canvasValidation = (body.config as JsonRecord | undefined)?.canvasLayout !== undefined
        ? validateAgentCanvasLayout((body.config as JsonRecord).canvasLayout)
        : { valid: true, normalizedLayout: existing.canvas_layout || [], workflowIds: [] as string[] };
      if (!canvasValidation.valid) {
        return responseJson({ success: false, error: 'InvalidCanvasLayout', message: (canvasValidation as { message?: string }).message }, 400);
      }
      const capabilities = body.capabilities === undefined
        ? existing.capabilities
        : Array.isArray(body.capabilities)
          ? (body.capabilities as string[])
          : String(body.capabilities).split(',').map((item) => item.trim()).filter(Boolean);

      store.agents[agentIndex] = {
        ...existing,
        name: body.name !== undefined ? String(body.name) : existing.name,
        subtitle: body.subtitle !== undefined ? String(body.subtitle) : existing.subtitle,
        description: body.description !== undefined ? String(body.description) : existing.description,
        icon: body.icon !== undefined ? String(body.icon) : existing.icon,
        capabilities,
        system_prompt: body.systemPrompt !== undefined ? String(body.systemPrompt) : existing.system_prompt,
        status: body.status !== undefined ? String(body.status) : existing.status,
        canvas_layout: (body.config as JsonRecord | undefined)?.canvasLayout !== undefined
          ? canvasValidation.normalizedLayout
          : existing.canvas_layout,
      };

      if (Array.isArray(body.workflows) || canvasValidation.workflowIds.length > 0) {
        const workflowIds = Array.isArray(body.workflows) && (body.workflows as string[]).length > 0
          ? (body.workflows as string[])
          : canvasValidation.workflowIds;
        store.agentWorkflowLinks = store.agentWorkflowLinks.filter((link) => link.agent_id !== agentId);
        workflowIds.forEach((workflowId) => {
          store.agentWorkflowLinks.push({ agent_id: agentId, workflow_id: workflowId, can_trigger: 1, can_modify: 0, created_at: new Date().toISOString() });
        });
      }

      addAuditEntry(store, 'AGENT_UPDATE', `Updated agent ${store.agents[agentIndex].name}`, agentId, {
        metadata: { workflowIds: canvasValidation.workflowIds },
      });
      writeStore(store);
      return responseJson({ success: true, agent: store.agents[agentIndex] });
    }

    if (method === 'DELETE') {
      if (store.agents[agentIndex].is_template) {
        return responseJson({ success: false, message: 'Cannot delete template agents' }, 403);
      }
      const deleted = store.agents.splice(agentIndex, 1)[0];
      store.agentWorkflowLinks = store.agentWorkflowLinks.filter((link) => link.agent_id !== agentId);
      addAuditEntry(store, 'AGENT_DELETE', `Deleted agent ${deleted.name}`, agentId);
      writeStore(store);
      return responseJson({ success: true, message: `Agent ${agentId} deleted` });
    }
  }

  return null;
}

function handleWorkflows(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  if (method === 'GET' && url.pathname === '/api/workflow') {
    const includeAgentWorkflows = url.searchParams.get('includeAgentWorkflows') === 'true';
    const workflows = store.workflows.filter((workflow) => includeAgentWorkflows || workflow.is_agent !== 1);
    return responseJson({ workflows });
  }

  if (method === 'POST' && url.pathname === '/api/workflow') {
    const body = parseBody(init);
    const now = new Date().toISOString();
    const workflow: BrowserWorkflowRecord = {
      id: uuid(),
      name: String(body.name || 'Untitled Workflow'),
      description: String(body.description || ''),
      nodes: JSON.stringify(body.nodes || []),
      edges: JSON.stringify(body.edges || []),
      status: String(body.status || 'draft') as BrowserWorkflowRecord['status'],
      category: String(body.category || 'General'),
      tags: JSON.stringify(body.tags || []),
      triggers: JSON.stringify(body.triggers || []),
      allow_agent_invocation: (body.metadata as JsonRecord | undefined)?.allowAgentInvocation === false ? 0 : 1,
      is_default: 0,
      is_agent: 0,
      created_at: now,
      updated_at: now,
    };

    store.workflows.unshift(workflow);

    const workflowNodes = Array.isArray(body.nodes) ? (body.nodes as Array<Record<string, unknown>>) : [];
    const approvalNodes = workflowNodes.filter((node) => String(node.nodeType).toLowerCase() === 'approval');
    approvalNodes.forEach((node) => {
      store.approvals.unshift({
        id: uuid(),
        workflow_run_id: `run-${uuid()}`,
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        node_id: String(node.instanceId || uuid()),
        node_name: String(node.name || 'Approval Node'),
        title: String((node.config as JsonRecord | undefined)?.title || 'Approval Required'),
        description: String((node.config as JsonRecord | undefined)?.description || 'Review this approval request'),
        context: { workflowName: workflow.name },
        assigned_to: String((node.config as JsonRecord | undefined)?.assignedTo || 'admin'),
        priority: (((node.config as JsonRecord | undefined)?.priority as BrowserApprovalRecord['priority']) || 'medium'),
        deadline: resolveDeadline(now, (node.config as JsonRecord | undefined)?.deadline),
        escalation_policy: typeof (node.config as JsonRecord | undefined)?.escalationPolicy === 'string' ? String((node.config as JsonRecord).escalationPolicy) : null,
        status: 'PENDING',
        decision_comment: null,
        created_at: now,
        resolved_at: null,
        resolved_by: null,
      });
    });

    addAuditEntry(store, 'workflow.create', `Created workflow ${workflow.name}`);
    writeStore(store);
    return responseJson({ success: true, workflow, id: workflow.id }, 201);
  }

  const workflowAgentsMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/agents$/);
  if (workflowAgentsMatch && method === 'GET') {
    const workflowId = decodeURIComponent(workflowAgentsMatch[1]);
    const agents = store.agentWorkflowLinks
      .filter((link) => link.workflow_id === workflowId)
      .map((link) => store.agents.find((agent) => agent.id === link.agent_id || agent.agent_id === link.agent_id))
      .filter(Boolean)
      .map((agent) => ({
        agent_id: (agent as BrowserAgentRecord).agent_id,
        name: (agent as BrowserAgentRecord).name,
        icon: (agent as BrowserAgentRecord).icon,
        color: (agent as BrowserAgentRecord).color,
      }));
    return responseJson({ success: true, agents });
  }

  const workflowRunsMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/runs$/);
  if (workflowRunsMatch && method === 'GET') {
    const workflowId = decodeURIComponent(workflowRunsMatch[1]);
    return responseJson({ success: true, runs: store.runs.filter((run) => run.workflow_id === workflowId) });
  }

  const workflowRunMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/runs\/([^/]+)$/);
  if (workflowRunMatch && method === 'GET') {
    const workflowId = decodeURIComponent(workflowRunMatch[1]);
    const runId = decodeURIComponent(workflowRunMatch[2]);
    const run = store.runs.find((item) => item.workflow_id === workflowId && item.id === runId);
    if (!run) {
      return responseJson({ success: false, message: 'Workflow run not found' }, 404);
    }
    return responseJson({ success: true, run });
  }

  const workflowMetricsMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/metrics$/);
  if (workflowMetricsMatch && method === 'GET') {
    const workflowId = decodeURIComponent(workflowMetricsMatch[1]);
    const workflowRuns = store.runs.filter((run) => run.workflow_id === workflowId);
    return responseJson({
      success: true,
      metrics: {
        totalRuns: workflowRuns.length,
        completedRuns: workflowRuns.filter((run) => run.status === 'COMPLETED').length,
        failedRuns: workflowRuns.filter((run) => run.status === 'FAILED').length,
      },
    });
  }

  const workflowExecuteMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/(execute|dry-run)$/);
  if (workflowExecuteMatch && method === 'POST') {
    const workflowId = decodeURIComponent(workflowExecuteMatch[1]);
    const dryRun = workflowExecuteMatch[2] === 'dry-run';
    const workflow = store.workflows.find((item) => item.id === workflowId);
    if (!workflow) {
      return responseJson({ success: false, message: 'Workflow not found' }, 404);
    }
    const body = parseBody(init);
    const initialContext = ((body.context as JsonRecord | undefined) || body) as JsonRecord;
    return responseJson(executeWorkflowLocally(store, workflow, initialContext, dryRun), dryRun ? 200 : 200);
  }

  const workflowPublishMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)\/(publish|unpublish)$/);
  if (workflowPublishMatch && method === 'POST') {
    const workflowId = decodeURIComponent(workflowPublishMatch[1]);
    const publishAction = workflowPublishMatch[2];
    const workflow = store.workflows.find((item) => item.id === workflowId);
    if (!workflow) {
      return responseJson({ success: false, message: 'Workflow not found' }, 404);
    }
    workflow.status = publishAction === 'publish' ? 'active' : 'draft';
    workflow.updated_at = new Date().toISOString();
    addAuditEntry(store, `workflow.${publishAction}`, `${publishAction}ed workflow ${workflow.name}`);
    writeStore(store);
    return responseJson({ success: true, workflow, message: `Workflow ${publishAction}ed successfully` });
  }

  const workflowItemMatch = url.pathname.match(/^\/api\/workflow\/([^/]+)$/);
  if (workflowItemMatch) {
    const workflowId = decodeURIComponent(workflowItemMatch[1]);
    const workflowIndex = store.workflows.findIndex((workflow) => workflow.id === workflowId);
    if (workflowIndex === -1) {
      return responseJson({ success: false, message: 'Workflow not found' }, 404);
    }

    if (method === 'GET') {
      return responseJson({ success: true, workflow: store.workflows[workflowIndex] });
    }

    if (method === 'PUT') {
      const body = parseBody(init);
      const existing = store.workflows[workflowIndex];
      store.workflows[workflowIndex] = {
        ...existing,
        name: body.name !== undefined ? String(body.name) : existing.name,
        description: body.description !== undefined ? String(body.description) : existing.description,
        nodes: body.nodes !== undefined ? JSON.stringify(body.nodes) : existing.nodes,
        edges: body.edges !== undefined ? JSON.stringify(body.edges) : existing.edges,
        status: body.status !== undefined ? (String(body.status) as BrowserWorkflowRecord['status']) : existing.status,
        category: body.category !== undefined ? String(body.category) : existing.category,
        tags: body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags,
        triggers: body.triggers !== undefined ? JSON.stringify(body.triggers) : existing.triggers,
        allow_agent_invocation: (body.metadata as JsonRecord | undefined)?.allowAgentInvocation !== undefined
          ? ((body.metadata as JsonRecord).allowAgentInvocation ? 1 : 0)
          : existing.allow_agent_invocation,
        updated_at: new Date().toISOString(),
      };
      addAuditEntry(store, 'workflow.update', `Updated workflow ${store.workflows[workflowIndex].name}`);
      writeStore(store);
      return responseJson({ success: true, workflow: store.workflows[workflowIndex] });
    }

    if (method === 'DELETE') {
      const deleted = store.workflows.splice(workflowIndex, 1)[0];
      store.agentWorkflowLinks = store.agentWorkflowLinks.filter((link) => link.workflow_id !== workflowId);
      store.runs = store.runs.filter((run) => run.workflow_id !== workflowId);
      store.approvals = store.approvals.filter((approval) => approval.workflow_id !== workflowId);
      addAuditEntry(store, 'workflow.delete', `Deleted workflow ${deleted.name}`);
      writeStore(store);
      return responseJson({ success: true, message: 'Workflow deleted' });
    }
  }

  return null;
}

function handleVersions(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  const createMatch = url.pathname.match(/^\/api\/versions\/([^/]+)\/create$/);
  if (createMatch && method === 'POST') {
    const workflowId = decodeURIComponent(createMatch[1]);
    const workflow = store.workflows.find((item) => item.id === workflowId);
    if (!workflow) {
      return responseJson({ error: 'Workflow not found' }, 404);
    }

    const body = parseBody(init);
    const snapshot = createWorkflowVersionSnapshot(
      store,
      workflow,
      String(body.changeSummary || body.description || 'Version created'),
      String(body.createdBy || 'browser-user')
    );
    addAuditEntry(store, 'workflow.version.create', `Created version ${snapshot.version_number} for ${workflow.name}`);
    writeStore(store);
    return responseJson({
      success: true,
      versionId: snapshot.id,
      versionNumber: snapshot.version_number,
      message: `Version ${snapshot.version_number} created successfully`,
    });
  }

  const listMatch = url.pathname.match(/^\/api\/versions\/([^/]+)\/list$/);
  if (listMatch && method === 'GET') {
    const workflowId = decodeURIComponent(listMatch[1]);
    const versions = store.versions
      .filter((version) => version.workflow_id === workflowId)
      .sort((a, b) => b.version_number - a.version_number)
      .map((version) => ({
        id: version.id,
        versionNumber: version.version_number,
        name: version.name,
        changeSummary: version.change_summary,
        createdBy: version.created_by,
        createdAt: version.created_at,
        size: {
          nodes: version.nodes.length,
          edges: version.edges.length,
        },
      }));
    return responseJson({ success: true, workflowId, versions });
  }

  const detailMatch = url.pathname.match(/^\/api\/versions\/([^/]+)\/versions\/([^/]+)$/);
  if (detailMatch && method === 'GET') {
    const workflowId = decodeURIComponent(detailMatch[1]);
    const versionNumber = parseInt(detailMatch[2], 10);
    const version = store.versions.find((item) => item.workflow_id === workflowId && item.version_number === versionNumber);
    if (!version) {
      return responseJson({ error: 'Version not found' }, 404);
    }
    return responseJson({
      success: true,
      version: {
        id: version.id,
        workflowId: version.workflow_id,
        versionNumber: version.version_number,
        name: version.name,
        description: version.description,
        nodes: parseJsonArray(version.nodes),
        edges: parseJsonArray(version.edges),
        status: version.status,
        category: version.category,
        tags: parseJsonArray<string>(version.tags),
        triggers: parseJsonArray<string>(version.triggers),
        changeSummary: version.change_summary,
        createdBy: version.created_by,
        createdAt: version.created_at,
      },
    });
  }

  const restoreMatch = url.pathname.match(/^\/api\/versions\/([^/]+)\/restore\/([^/]+)$/);
  if (restoreMatch && method === 'POST') {
    const workflowId = decodeURIComponent(restoreMatch[1]);
    const versionNumber = parseInt(restoreMatch[2], 10);
    const workflow = store.workflows.find((item) => item.id === workflowId);
    const version = store.versions.find((item) => item.workflow_id === workflowId && item.version_number === versionNumber);
    if (!workflow || !version) {
      return responseJson({ error: 'Version not found' }, 404);
    }
    const body = parseBody(init);
    if (body.createBackup !== false) {
      createWorkflowVersionSnapshot(store, workflow, `Auto-backup before restoring to v${versionNumber}`, String(body.createdBy || 'browser-user'));
    }
    workflow.name = version.name;
    workflow.description = version.description;
    workflow.nodes = version.nodes;
    workflow.edges = version.edges;
    workflow.status = version.status as BrowserWorkflowRecord['status'];
    workflow.category = version.category;
    workflow.tags = version.tags;
    workflow.triggers = version.triggers;
    workflow.updated_at = new Date().toISOString();
    addAuditEntry(store, 'workflow.version.restore', `Restored ${workflow.name} to version ${versionNumber}`);
    writeStore(store);
    return responseJson({ success: true, message: `Workflow restored to version ${versionNumber}`, restoredVersion: versionNumber });
  }

  const compareMatch = url.pathname.match(/^\/api\/versions\/([^/]+)\/compare\/([^/]+)\/([^/]+)$/);
  if (compareMatch && method === 'GET') {
    const workflowId = decodeURIComponent(compareMatch[1]);
    const version1 = parseInt(compareMatch[2], 10);
    const version2 = parseInt(compareMatch[3], 10);
    const v1 = store.versions.find((item) => item.workflow_id === workflowId && item.version_number === version1);
    const v2 = store.versions.find((item) => item.workflow_id === workflowId && item.version_number === version2);
    if (!v1 || !v2) {
      return responseJson({ error: 'One or both versions not found' }, 404);
    }
    return responseJson({ success: true, comparison: buildWorkflowComparison(v1, v2) });
  }

  return null;
}

function handleApprovals(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  if (method === 'GET' && url.pathname === '/api/approvals/pending') {
    const assignedTo = url.searchParams.get('assignedTo');
    const approvals = store.approvals.filter(
      (approval) => approval.status === 'PENDING' && (!assignedTo || approval.assigned_to === assignedTo)
    );
    return responseJson({ success: true, approvals });
  }

  const approvalItemMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)$/);
  if (approvalItemMatch && method === 'GET') {
    const approvalId = decodeURIComponent(approvalItemMatch[1]);
    const approval = store.approvals.find((item) => item.id === approvalId);
    if (!approval) {
      return responseJson({ success: false, message: 'Approval not found' }, 404);
    }
    return responseJson({ success: true, approval });
  }

  if (method === 'GET' && url.pathname === '/api/approvals/stats/summary') {
    const approved = store.approvals.filter((approval) => approval.status === 'APPROVED').length;
    const rejected = store.approvals.filter((approval) => approval.status === 'REJECTED').length;
    const expired = store.approvals.filter((approval) => approval.status === 'EXPIRED').length;
    const pending = store.approvals.filter((approval) => approval.status === 'PENDING').length;
    const resolved = store.approvals.filter((approval) => approval.resolved_at && approval.created_at).map((approval) => {
      const started = Date.parse(String(approval.created_at));
      const resolvedAt = Date.parse(String(approval.resolved_at));
      return Number.isFinite(started) && Number.isFinite(resolvedAt) ? (resolvedAt - started) / 60000 : 0;
    });
    return responseJson({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        expired,
        total: store.approvals.length,
        averageResponseTimeMinutes: resolved.length > 0 ? Math.round(resolved.reduce((sum, value) => sum + value, 0) / resolved.length) : 0,
      },
    });
  }

  const approvalActionMatch = url.pathname.match(/^\/api\/approvals\/([^/]+)\/(approve|reject)$/);
  if (approvalActionMatch && method === 'POST') {
    const approvalId = decodeURIComponent(approvalActionMatch[1]);
    const action = approvalActionMatch[2];
    const approval = store.approvals.find((item) => item.id === approvalId);
    if (!approval) {
      return responseJson({ success: false, message: 'Approval not found' }, 404);
    }

    const body = parseBody(init);
    const now = new Date().toISOString();
    approval.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
    approval.decision_comment = typeof body.comment === 'string' ? body.comment : null;
    approval.decision_data = (body.data as JsonRecord | undefined) || approval.decision_data || null;
    approval.resolved_at = now;
    approval.resolved_by = String(body.approvedBy || body.rejectedBy || 'browser-user');
    const run = store.runs.find((item) => item.id === approval.workflow_run_id);
    let context: JsonRecord = approval.context;

    if (run) {
      context = safeParseJson<JsonRecord>(run.context, {});
      const workflowState = ((context.workflowState as JsonRecord | undefined) || {}) as JsonRecord;
      const metadata = ((context.metadata as JsonRecord | undefined) || {}) as JsonRecord;
      run.status = action === 'approve' ? 'COMPLETED' : 'FAILED';
      run.completed_at = now;
      run.error_message = action === 'approve' ? null : 'Approval rejected';
      run.context = JSON.stringify({
        ...context,
        approval: {
          id: approval.id,
          status: approval.status,
          comment: approval.decision_comment,
          resolvedAt: now,
        },
        metadata: {
          ...metadata,
          notifications: [
            ...((Array.isArray(metadata.notifications) ? metadata.notifications : []) as unknown[]),
            action === 'approve'
              ? `${approval.title} approved and workflow resumed.`
              : `${approval.title} rejected and workflow halted.`,
          ],
        },
        workflowState: {
          ...workflowState,
          pendingNodeIds: [],
          currentNodeId: approval.node_id,
          lastError: action === 'approve' ? null : 'Approval rejected',
        },
      });

      store.workflowLogs.unshift({
        id: uuid(),
        run_id: run.id,
        node_id: approval.node_id,
        node_type: 'approval',
        status: action === 'approve' ? 'completed' : 'failed',
        duration_ms: 90,
        error: action === 'approve' ? null : 'Approval rejected',
        timestamp: now,
      });
    }

    addAuditEntry(store, action === 'approve' ? 'APPROVAL_APPROVED' : 'APPROVAL_REJECTED', `${action === 'approve' ? 'Approved' : 'Rejected'} approval ${approval.title}`, String(context?.metadata && (context.metadata as JsonRecord).agentId || 'system'), {
      decision: approval.status,
      inputPreview: typeof body.comment === 'string' ? body.comment : approval.description,
      metadata: { workflowRunId: approval.workflow_run_id, workflowId: approval.workflow_id },
    });
    writeStore(store);
    return responseJson({
      success: true,
      approvalId,
      workflowRunId: approval.workflow_run_id,
      workflowId: approval.workflow_id,
      status: run?.status || approval.status,
      waitingForApproval: false,
      context,
      timestamp: now,
    });
  }

  return null;
}

function handleNiyanta(url: URL, method: string, store: BrowserStoreShape, init?: RequestInit): Response | null {
  if (method === 'POST' && url.pathname === '/api/niyanta/chat') {
    const body = parseBody(init);
    const message = String(body.message || '').trim();
    const metrics = buildMetrics(store);
    const recentRuns = Array.isArray(metrics.recentRuns) ? (metrics.recentRuns as Array<Record<string, unknown>>) : [];
    const agentResults = ((body.agentResults as Record<string, unknown> | undefined) || {}) as Record<string, unknown>;
    const activeAgentNames = Object.keys(agentResults).slice(0, 4);
    const replyParts = [
      message ? `Niyanta reviewed: ${message}` : 'Niyanta reviewed the current workspace state.',
      `There are ${Number(metrics.pendingApprovals || 0)} pending approvals and ${Number(metrics.failedToday || 0)} failed run${Number(metrics.failedToday || 0) === 1 ? '' : 's'} today.`,
      recentRuns.length > 0 ? `Latest workflow activity: ${String(recentRuns[0].workflowName || 'workflow')} is ${String(recentRuns[0].status || 'active')}.` : 'No workflow runs have been recorded yet.',
      activeAgentNames.length > 0 ? `Tracked agent outputs are available for ${activeAgentNames.join(', ')}.` : 'No agent outputs are currently attached to this chat.',
    ];

    return responseJson({
      reply: replyParts.join(' '),
      timestamp: new Date().toISOString(),
    });
  }

  if (method === 'POST' && url.pathname === '/api/niyanta/insights') {
    const body = parseBody(init);
    const metrics = buildMetrics(store);
    const agentResults = ((body.agentResults as Record<string, unknown> | undefined) || {}) as Record<string, unknown>;
    const insights = [
      Number(metrics.pendingApprovals || 0) > 0
        ? `${Number(metrics.pendingApprovals || 0)} workflow${Number(metrics.pendingApprovals || 0) === 1 ? '' : 's'} require human approval.`
        : 'No workflows are waiting on human approval.',
      Number(metrics.failedToday || 0) > 0
        ? `${Number(metrics.failedToday || 0)} run${Number(metrics.failedToday || 0) === 1 ? '' : 's'} failed today and should be reviewed.`
        : 'No failed runs have been recorded today.',
      Object.keys(agentResults).length > 0
        ? `Cross-agent context is available from ${Object.keys(agentResults).length} recent result${Object.keys(agentResults).length === 1 ? '' : 's'}.`
        : 'Run agents to populate cross-workflow insights.',
    ];

    return responseJson({ insights });
  }

  return null;
}

function handleObservability(url: URL, method: string, store: BrowserStoreShape): Response | null {
  if (method === 'GET' && url.pathname === '/api/audit') {
    return responseJson({ entries: store.auditEntries, total: store.auditEntries.length });
  }

  if (method === 'GET' && url.pathname === '/api/audit/decisions') {
    return responseJson({ entries: store.auditEntries.filter((entry) => String(entry.decision || '').trim().length > 0) });
  }

  const agentAuditMatch = url.pathname.match(/^\/api\/audit\/agent\/([^/]+)$/);
  if (agentAuditMatch && method === 'GET') {
    const agentId = decodeURIComponent(agentAuditMatch[1]);
    return responseJson({ entries: store.auditEntries.filter((entry) => entry.agent_id === agentId) });
  }

  if (method === 'GET' && url.pathname === '/api/metrics') {
    return responseJson(buildMetrics(store));
  }

  if (method === 'GET' && url.pathname === '/api/health') {
    return responseJson(buildHealth(store));
  }

  return null;
}

function shouldBypass(url: URL): boolean {
  if (!url.pathname.startsWith('/api/')) {
    return true;
  }

  return url.pathname.startsWith('/api/port') || url.pathname === '/api/agent/message';
}

async function handleBrowserApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const requestUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;

  const url = new URL(requestUrl, window.location.origin);
  if (shouldBypass(url)) {
    return null;
  }

  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const store = readStore();

  const handlers = [
    handleTemplates,
    handleAgents,
    handleWorkflows,
    handleVersions,
    handleApprovals,
    handleNiyanta,
    handleObservability,
  ];

  for (const handler of handlers) {
    const response = handler(url, method, store, init);
    if (response) {
      return response;
    }
  }

  return responseJson({ success: false, message: `Browser storage mode does not implement ${method} ${url.pathname}` }, 501);
}

export function installBrowserApiInterceptor(): void {
  if (!isBrowserStorageMode() || typeof window === 'undefined') {
    return;
  }

  const flaggedWindow = window as Window & { [FETCH_MARKER]?: boolean };
  if (flaggedWindow[FETCH_MARKER]) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const intercepted = await handleBrowserApi(input, init);
    if (intercepted) {
      return intercepted;
    }
    return originalFetch(input, init);
  };

  flaggedWindow[FETCH_MARKER] = true;
}