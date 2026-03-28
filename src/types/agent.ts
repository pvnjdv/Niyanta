export interface Agent {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  glow: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'processing' | 'complete' | 'error';
  isTemplate?: boolean;
}

export interface Message {
  id: string;
  type: 'user' | 'agent' | 'insight' | 'error';
  content: string;
  timestamp: string;
  result?: Record<string, unknown>;
  processingTime?: number;
  model?: string;
}

export interface AgentState {
  status: 'idle' | 'processing' | 'complete' | 'error';
  messages: Message[];
  result: Record<string, unknown> | null;
  taskCount: number;
  lastActivity: string | null;
  processingTime: number | null;
}
