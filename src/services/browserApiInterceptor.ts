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
  agentId: string;
  action: string;
  details: string;
  timestamp: string;
  decision?: string;
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
  versions: BrowserVersionRecord[];
  agentWorkflowLinks: Array<{ agent_id: string; workflow_id: string; can_trigger: number; can_modify: number; created_at: string }>;
  templates: typeof BROWSER_WORKFLOW_TEMPLATES;
}

const STORE_KEY = 'niyanta-browser-store-v1';
const FETCH_MARKER = '__niyantaBrowserInterceptorInstalled';

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

  return {
    agents,
    workflows: [],
    approvals: [],
    auditEntries: [],
    runs: [],
    versions: [],
    agentWorkflowLinks: [],
    templates: BROWSER_WORKFLOW_TEMPLATES,
  };
}

function readStore(): BrowserStoreShape {
  const store = readLocalStorage<BrowserStoreShape>(STORE_KEY, buildDefaultStore());
  return {
    ...buildDefaultStore(),
    ...store,
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

function addAuditEntry(store: BrowserStoreShape, action: string, details: string, agentId = 'system') {
  store.auditEntries.unshift({
    id: uuid(),
    agentId,
    action,
    details,
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
  const pendingApprovals = store.approvals.filter((approval) => approval.status === 'PENDING').length;
  const totalRuns = store.runs.length;
  const failedToday = store.runs.filter((run) => run.status === 'FAILED').length;
  const activeAgents = store.agents.filter((agent) => agent.status === 'active').length;

  return {
    totalRuns,
    failedToday,
    pendingApprovals,
    criticalAlerts: store.approvals.filter((approval) => approval.priority === 'critical' && approval.status === 'PENDING').length,
    activeAgents,
    workflows: store.workflows.length,
    lastUpdated: new Date().toISOString(),
  };
}

function buildHealth(store: BrowserStoreShape): JsonRecord {
  return {
    status: 'ok',
    storageMode: 'browser',
    persistence: 'localStorage',
    agents: store.agents.length,
    workflows: store.workflows.length,
    approvals: store.approvals.filter((approval) => approval.status === 'PENDING').length,
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
    deadline: typeof config.deadline === 'string' ? String(config.deadline) : null,
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

function executeWorkflowLocally(
  store: BrowserStoreShape,
  workflow: BrowserWorkflowRecord,
  initialContext: JsonRecord,
  dryRun: boolean
) {
  const now = new Date().toISOString();
  const runId = `run-${uuid()}`;
  const nodes = parseJsonArray<Record<string, unknown>>(workflow.nodes);
  const approvalNodes = nodes.filter((node) => normalizeNodeType(node.nodeType) === 'approval');
  const status = approvalNodes.length > 0 ? 'WAITING_APPROVAL' : 'COMPLETED';
  const resultContext = {
    ...initialContext,
    workflowId: workflow.id,
    workflowName: workflow.name,
    executedIn: dryRun ? 'browser-dry-run' : 'browser-run',
    nodeCount: nodes.length,
    approvalCount: approvalNodes.length,
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

    approvalNodes.forEach((node) => {
      store.approvals.unshift(createApprovalRecord(node, workflow, runId, now));
    });

    addAuditEntry(store, 'workflow.execute', `Executed workflow ${workflow.name}`);
    writeStore(store);
  }

  return {
    success: true,
    workflowId: workflow.id,
    runId,
    context: resultContext,
    status,
    timestamp: now,
    dryRun,
  };
}

function executeAgentLocally(store: BrowserStoreShape, agentId: string, input: string) {
  const agent = store.agents.find((item) => item.id === agentId || item.agent_id === agentId);
  if (!agent) {
    return responseJson({ success: false, error: 'InvalidAgent', message: `Unsupported agent: ${agentId}` }, 400);
  }

  const timestamp = new Date().toISOString();
  const taskTitle = input.trim().slice(0, 48) || `${agent.name} review`;
  const result = {
    summary: `${agent.name} completed a browser-mode local execution for the provided input.`,
    details: {
      mode: 'browser-storage',
      inputPreview: input.trim().slice(0, 200),
      capabilities: agent.capabilities,
      generatedAt: timestamp,
    },
    tasks: [
      {
        title: taskTitle,
        owner: 'Admin',
        priority: 'medium',
        status: 'open',
      },
    ],
    whyChain: [
      'Input received in browser storage mode.',
      `Agent ${agent.name} resolved locally without backend persistence.`,
      'Result was generated for demo/local-first operation.',
    ],
  };

  addAuditEntry(store, 'agent.run', `Executed agent ${agent.name}`, agentId);
  writeStore(store);
  return responseJson({
    success: true,
    sessionId: uuid(),
    agentId,
    result,
    processingTime: 120,
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
    return executeAgentLocally(store, String(body.agentId || ''), String(body.input || ''));
  }

  if (method === 'GET' && url.pathname === '/api/agent/list') {
    return responseJson({ agents: store.agents });
  }

  if (method === 'POST' && url.pathname === '/api/agent') {
    const body = parseBody(init);
    const now = new Date().toISOString();
    const agentId = `agent_${uuid().slice(0, 8)}`;
    const linkedWorkflows = Array.isArray(body.workflows) ? (body.workflows as string[]) : [];
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
      canvas_layout: Array.isArray((body.config as JsonRecord | undefined)?.canvasLayout)
        ? (((body.config as JsonRecord).canvasLayout) as unknown[])
        : [],
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
    addAuditEntry(store, 'agent.create', `Created agent ${agent.name}`, agentId);
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
          ? (((body.config as JsonRecord).canvasLayout) as unknown[])
          : existing.canvas_layout,
      };

      if (Array.isArray(body.workflows)) {
        store.agentWorkflowLinks = store.agentWorkflowLinks.filter((link) => link.agent_id !== agentId);
        (body.workflows as string[]).forEach((workflowId) => {
          store.agentWorkflowLinks.push({ agent_id: agentId, workflow_id: workflowId, can_trigger: 1, can_modify: 0, created_at: new Date().toISOString() });
        });
      }

      addAuditEntry(store, 'agent.update', `Updated agent ${store.agents[agentIndex].name}`, agentId);
      writeStore(store);
      return responseJson({ success: true, agent: store.agents[agentIndex] });
    }

    if (method === 'DELETE') {
      if (store.agents[agentIndex].is_template) {
        return responseJson({ success: false, message: 'Cannot delete template agents' }, 403);
      }
      const deleted = store.agents.splice(agentIndex, 1)[0];
      store.agentWorkflowLinks = store.agentWorkflowLinks.filter((link) => link.agent_id !== agentId);
      addAuditEntry(store, 'agent.delete', `Deleted agent ${deleted.name}`, agentId);
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
        deadline: typeof (node.config as JsonRecord | undefined)?.deadline === 'string' ? String((node.config as JsonRecord).deadline) : null,
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

  if (method === 'GET' && url.pathname === '/api/approvals/stats/summary') {
    const approved = store.approvals.filter((approval) => approval.status === 'APPROVED').length;
    const rejected = store.approvals.filter((approval) => approval.status === 'REJECTED').length;
    const expired = store.approvals.filter((approval) => approval.status === 'EXPIRED').length;
    const pending = store.approvals.filter((approval) => approval.status === 'PENDING').length;
    return responseJson({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        expired,
        total: store.approvals.length,
        averageResponseTimeMinutes: 0,
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
    approval.resolved_at = now;
    approval.resolved_by = String(body.approvedBy || body.rejectedBy || 'browser-user');
    addAuditEntry(store, `approval.${action}`, `${action}d approval ${approval.title}`);
    writeStore(store);
    return responseJson({ success: true, approvalId, workflowRunId: approval.workflow_run_id, timestamp: now });
  }

  return null;
}

function handleObservability(url: URL, method: string, store: BrowserStoreShape): Response | null {
  if (method === 'GET' && url.pathname === '/api/audit') {
    return responseJson({ entries: store.auditEntries, total: store.auditEntries.length });
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

  return url.pathname.startsWith('/api/niyanta') || url.pathname.startsWith('/api/port') || url.pathname === '/api/agent/message';
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