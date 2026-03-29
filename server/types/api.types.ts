export interface RunAgentRequest {
  agentId: string;
  input: string;
  workflowContext?: Record<string, unknown>;
}

export interface NiyantaChatRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentResults: Record<string, unknown>;
  systemContext?: NiyantaSystemContext;
}

export interface NiyantaCommandAttachment {
  name: string;
  size: number;
  type: string;
  excerpt: string;
  textContent?: string;
  pageCount?: number;
  sheetNames?: string[];
  extractionStatus?: 'ok' | 'unsupported';
}

export interface NiyantaCommandRequest {
  message: string;
  attachments?: NiyantaCommandAttachment[];
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentResults?: Record<string, unknown>;
}

export interface NiyantaSystemContext {
  generatedAt?: string;
  agents?: Array<Record<string, unknown>>;
  workflows?: Array<Record<string, unknown>>;
  metrics?: Record<string, unknown>;
  auditTrail?: Array<Record<string, unknown>>;
  reports?: Array<Record<string, unknown>>;
}

export type NiyantaTone = 'info' | 'success' | 'warning' | 'danger';

export interface NiyantaActivityItem {
  id: string;
  label: string;
  detail: string;
  tone: NiyantaTone;
  timestamp: string;
}

export interface NiyantaReportCard {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: NiyantaTone;
}

export interface NiyantaChatResponse {
  reply: string;
  timestamp: string;
  activity: NiyantaActivityItem[];
  reports: NiyantaReportCard[];
}

export interface NiyantaCommandResponse extends NiyantaChatResponse {
  matchedAgents: Array<{ agentId: string; label: string }>;
  workflowId?: string;
  runId?: string;
  status: 'COMPLETED' | 'WAITING_APPROVAL' | 'FAILED';
  decision: string;
  inputType: string;
}

export interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  code?: string;
}

export interface MetricsResponse {
  totalWorkflowsRun: number;
  totalTasksCreated: number;
  totalDecisionsMade: number;
  escalationsTriggered: number;
  avgProcessingTimeMs: number;
  agentsActive: number;
  uptimeSeconds: number;
  agentRunCounts: Record<string, number>;
  decisionBreakdown: {
    autoApprove: number;
    flag: number;
    reject: number;
    proceed: number;
    hold: number;
    escalate: number;
    other: number;
  };
  workflowStatusBreakdown: {
    PENDING: number;
    RUNNING: number;
    WAITING_APPROVAL: number;
    FAILED: number;
    COMPLETED: number;
  };
}
