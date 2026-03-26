export interface AgentDefinition {
  agent_id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  capabilities: string[];
  status: 'active' | 'disabled' | 'error';
  systemPrompt: string;
  description: string;
}

export interface AgentMessage {
  type: 'request' | 'response' | 'notification' | 'error' | 'approval_required';
  from: string;
  to: string;
  payload: Record<string, unknown>;
  timestamp: string;
  messageId: string;
}

export interface AgentRunResult {
  success: boolean;
  sessionId: string;
  agentId: string;
  result: Record<string, unknown>;
  processingTime: number;
  timestamp: string;
  model: string;
}
