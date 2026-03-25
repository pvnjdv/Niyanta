const API_BASE = '/api';

export async function runAgent(agentId, inputText) {
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

  return data;
}

export async function sendNiyantaMessage(message, conversationHistory, agentResults) {
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

  return data;
}

export async function fetchAuditLog() {
  const response = await fetch(`${API_BASE}/audit`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch audit log');
  }

  return data;
}

export async function fetchMetrics() {
  const response = await fetch(`${API_BASE}/metrics`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch metrics');
  }

  return data;
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Health check failed');
  }

  return data;
}
