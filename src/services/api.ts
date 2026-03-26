const BASE = '/api';

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
  agentResults: Record<string, unknown>
): Promise<{ reply: string; timestamp: string }> {
  const response = await fetch(`${BASE}/niyanta/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationHistory, agentResults }),
  });
  if (!response.ok) throw new Error('Niyanta chat failed');
  return response.json();
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
