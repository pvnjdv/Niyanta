export interface RunAgentRequest {
  agentId: string;
  input: string;
  workflowContext?: Record<string, unknown>;
}

export interface NiyantaChatRequest {
  message: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentResults: Record<string, unknown>;
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
