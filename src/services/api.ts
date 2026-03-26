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
