import {
  AgentId,
  AgentResult,
  AgentRunResponse,
  NiyantaChatResponse,
  AuditResponse,
  Metrics,
  HealthResponse,
  ChatMessage,
} from '../types';

const API_BASE = '/api';

export async function runAgent(agentId: AgentId, inputText: string): Promise<AgentRunResponse> {
  const response = await fetch(`${API_BASE}/agent/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      input: inputText,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Agent processing failed');
  }

  return data as AgentRunResponse;
}

export async function sendNiyantaMessage(
  message: string,
  conversationHistory: Pick<ChatMessage, 'role' | 'content'>[],
  agentResults: Partial<Record<AgentId, AgentResult | null>>
): Promise<NiyantaChatResponse> {
  const response = await fetch(`${API_BASE}/niyanta/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationHistory,
      agentResults,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Niyanta chat failed');
  }

  return data as NiyantaChatResponse;
}

export async function fetchAuditLog(): Promise<AuditResponse> {
  const response = await fetch(`${API_BASE}/audit`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch audit log');
  }

  return data as AuditResponse;
}

export async function fetchMetrics(): Promise<Metrics> {
  const response = await fetch(`${API_BASE}/metrics`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch metrics');
  }

  return data as Metrics;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Health check failed');
  }

  return data as HealthResponse;
}
