import {
  ExtractedFileAttachment,
  NiyantaActivityItem,
  NiyantaReportCard,
} from '../types/message';

const BASE = '/api';

export interface NiyantaSystemContext {
  generatedAt: string;
  agents: Array<Record<string, unknown>>;
  workflows: Array<Record<string, unknown>>;
  metrics: Record<string, unknown>;
  auditTrail: Array<Record<string, unknown>>;
  reports: Array<Record<string, unknown>>;
}

export interface NiyantaChatResponse {
  reply: string;
  timestamp: string;
  activity?: NiyantaActivityItem[];
  reports?: NiyantaReportCard[];
}

export interface RunAgentResponse {
  success: boolean;
  sessionId: string;
  agentId: string;
  result: Record<string, unknown>;
  processingTime: number;
  model: string;
  timestamp: string;
}

export interface AgentPort {
  id: string;
  agentId: string;
  portName: string;
  accessKey: string;
  isActive: boolean;
  allowedOperations: string[];
  rateLimit: number;
  totalRequests: number;
  createdAt: string;
  lastAccessed: string | null;
}

export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  messageType: string;
  payload: string;
  status: string;
  createdAt: string;
  processedAt: string | null;
}

export async function runAgent(agentId: string, inputText: string): Promise<RunAgentResponse> {
  const response = await fetch(`${BASE}/agent/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, input: inputText }),
  });

  if (!response.ok) throw new Error(`Agent run failed with status ${response.status}`);
  return response.json();
}

export async function sendNiyantaMessage(
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  agentResults: Record<string, unknown>,
  systemContext?: NiyantaSystemContext
): Promise<NiyantaChatResponse> {
  const response = await fetch(`${BASE}/niyanta/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, agentResults, systemContext }),
  });
  if (!response.ok) {
    let detail = 'Niyanta chat failed';
    try {
      const err = await response.json() as { message?: string };
      if (err.message) detail = err.message;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  return response.json();
}

export async function extractNiyantaFiles(files: File[]): Promise<ExtractedFileAttachment[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${BASE}/niyanta/extract`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract file content');
  }

  const data = await response.json() as { files?: ExtractedFileAttachment[] };
  return Array.isArray(data.files) ? data.files : [];
}

export async function fetchCrossWorkflowInsights(agentResults: Record<string, unknown>): Promise<string[]> {
  try {
    const response = await fetch(`${BASE}/niyanta/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentResults }),
    });
    if (!response.ok) return [];
    const data = (await response.json()) as { insights?: string[] };
    return data.insights || [];
  } catch {
    return [];
  }
}

export async function fetchAuditLog(): Promise<{ entries: unknown[]; total: number }> {
  const res = await fetch(`${BASE}/audit`);
  return res.json();
}

export async function fetchMetrics(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/metrics`);
  return res.json();
}

export async function fetchWorkflows(): Promise<{ workflows: unknown[] }> {
  const res = await fetch(`${BASE}/workflow`);
  return res.json();
}

export async function createWorkflow(payload: Record<string, unknown>): Promise<{ workflow: unknown }> {
  const res = await fetch(`${BASE}/workflow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function fetchHealth(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/health`);
  return res.json();
}

// --- Agent Messaging ---

export async function sendAgentMessage(
  fromAgent: string,
  toAgent: string,
  messageType: string,
  payload: string
): Promise<{ success: boolean; messageId: string }> {
  const res = await fetch(`${BASE}/agent/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromAgent, toAgent, messageType, payload }),
  });
  if (!res.ok) throw new Error('Failed to send agent message');
  return res.json();
}

export async function fetchAgentMessages(agentId: string): Promise<{ messages: AgentMessage[] }> {
  const res = await fetch(`${BASE}/agent/${agentId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch agent messages');
  return res.json();
}

// --- Agent Access Ports ---

export async function createAgentPort(
  agentId: string,
  portName: string,
  allowedOperations?: string[],
  rateLimit?: number
): Promise<{ success: boolean; port: AgentPort }> {
  const res = await fetch(`${BASE}/agent/port/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, portName, allowedOperations, rateLimit }),
  });
  if (!res.ok) throw new Error('Failed to create agent port');
  return res.json();
}

export async function fetchAllPorts(): Promise<{ ports: AgentPort[] }> {
  const res = await fetch(`${BASE}/agent/ports`);
  if (!res.ok) throw new Error('Failed to fetch ports');
  return res.json();
}

export async function fetchAgentPorts(agentId: string): Promise<{ ports: AgentPort[] }> {
  const res = await fetch(`${BASE}/agent/ports/${agentId}`);
  if (!res.ok) throw new Error('Failed to fetch agent ports');
  return res.json();
}

export async function accessAgentViaPort(
  accessKey: string,
  input: string
): Promise<RunAgentResponse> {
  const res = await fetch(`${BASE}/port/access/${accessKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Port access failed');
  return res.json();
}

export async function fetchPortInfo(accessKey: string): Promise<{
  success: boolean;
  port: {
    id: string;
    portName: string;
    agentId: string;
    agentName: string;
    capabilities: string[];
    description: string;
    isActive: boolean;
    allowedOperations: string[];
    rateLimit: number;
    totalRequests: number;
  };
}> {
  const res = await fetch(`${BASE}/port/info/${accessKey}`);
  if (!res.ok) throw new Error('Failed to fetch port info');
  return res.json();
}

// --- Agent CRUD ---

export async function fetchAgents(): Promise<{ agents: Array<Record<string, unknown>> }> {
  const res = await fetch(`${BASE}/agent/list`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

// --- Workflow CRUD ---

export async function fetchWorkflow(id: string): Promise<{ workflow: Record<string, unknown> }> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function updateWorkflow(id: string, payload: Record<string, unknown>): Promise<{ workflow: unknown }> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update workflow');
  return res.json();
}

export async function deleteWorkflow(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete workflow');
  return res.json();
}

export async function executeWorkflow(id: string, context?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context || {}),
  });
  if (!res.ok) throw new Error('Failed to execute workflow');
  return res.json();
}

export async function dryRunWorkflow(id: string, context?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}/dry-run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context || {}),
  });
  if (!res.ok) throw new Error('Failed to dry-run workflow');
  return res.json();
}

export async function publishWorkflow(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}/publish`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to publish workflow');
  return res.json();
}

export async function unpublishWorkflow(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(id)}/unpublish`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to unpublish workflow');
  return res.json();
}

export async function fetchWorkflowRuns(workflowId: string): Promise<{ runs: unknown[] }> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(workflowId)}/runs`);
  if (!res.ok) throw new Error('Failed to fetch workflow runs');
  return res.json();
}

export async function fetchWorkflowRun(workflowId: string, runId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(workflowId)}/runs/${encodeURIComponent(runId)}`);
  if (!res.ok) throw new Error('Failed to fetch workflow run');
  return res.json();
}

export async function fetchWorkflowMetrics(workflowId: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/workflow/${encodeURIComponent(workflowId)}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch workflow metrics');
  return res.json();
}

// --- Workflow Versions ---

export async function createWorkflowVersion(workflowId: string, description?: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/versions/${encodeURIComponent(workflowId)}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error('Failed to create version');
  return res.json();
}

export async function fetchWorkflowVersions(workflowId: string): Promise<{ versions: unknown[] }> {
  const res = await fetch(`${BASE}/versions/${encodeURIComponent(workflowId)}/list`);
  if (!res.ok) throw new Error('Failed to fetch versions');
  return res.json();
}

export async function fetchWorkflowVersion(workflowId: string, versionNumber: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/versions/${encodeURIComponent(workflowId)}/versions/${versionNumber}`);
  if (!res.ok) throw new Error('Failed to fetch version');
  return res.json();
}

export async function restoreWorkflowVersion(workflowId: string, versionNumber: number, backup?: boolean): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/versions/${encodeURIComponent(workflowId)}/restore/${versionNumber}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ createBackup: backup }),
  });
  if (!res.ok) throw new Error('Failed to restore version');
  return res.json();
}

export async function compareWorkflowVersions(workflowId: string, v1: number, v2: number): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/versions/${encodeURIComponent(workflowId)}/compare/${v1}/${v2}`);
  if (!res.ok) throw new Error('Failed to compare versions');
  return res.json();
}

// --- Approvals ---

export async function fetchPendingApprovals(filters?: Record<string, string>): Promise<{ approvals: unknown[] }> {
  const params = new URLSearchParams(filters || {});
  const res = await fetch(`${BASE}/approvals/pending?${params}`);
  if (!res.ok) throw new Error('Failed to fetch approvals');
  return res.json();
}

export async function fetchApproval(id: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/approvals/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch approval');
  return res.json();
}

export async function approveApproval(id: string, comment?: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/approvals/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment, data }),
  });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json();
}

export async function rejectApproval(id: string, comment?: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/approvals/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json();
}

export async function fetchApprovalStats(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/approvals/stats/summary`);
  if (!res.ok) throw new Error('Failed to fetch approval stats');
  return res.json();
}

// --- Templates ---

export async function fetchTemplates(filters?: Record<string, string>): Promise<{ templates: unknown[] }> {
  const params = new URLSearchParams(filters || {});
  const res = await fetch(`${BASE}/templates?${params}`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function instantiateTemplate(templateId: string, overrides?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/templates/${encodeURIComponent(templateId)}/instantiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(overrides || {}),
  });
  if (!res.ok) throw new Error('Failed to instantiate template');
  return res.json();
}
