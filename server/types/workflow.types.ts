export interface WorkflowContext {
  workflowId: string;
  runId: string;
  document: Record<string, unknown>;
  invoice: Record<string, unknown>;
  employee: Record<string, unknown>;
  procurement: Record<string, unknown>;
  finance: Record<string, unknown>;
  task: Record<string, unknown>;
  metadata: Record<string, unknown>;
  workflowState: {
    currentNodeId?: string;
    retries: Record<string, number>;
    startedAt: string;
    completedAt?: string;
    pendingNodeIds?: string[];
    executedNodeIds?: string[];
    lastError?: string;
    status: WorkflowStatus;
  };
  logs: WorkflowLog[];
}

export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'WAITING_APPROVAL' | 'FAILED' | 'COMPLETED';

export interface WorkflowLog {
  nodeId: string;
  nodeName: string;
  status: 'running' | 'completed' | 'failed' | 'waiting' | 'skipped';
  message: string;
  timestamp: string;
  durationMs?: number;
}

export interface WorkflowDefinition {
  workflowId: string;
  name: string;
  description: string;
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'disabled';
  category: string;
}

export interface WorkflowNodeInstance {
  instanceId: string;
  nodeType: string;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  retryConfig?: RetryConfig;
}

export interface WorkflowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  condition?: string;
}

export interface RetryConfig {
  maxRetries: number;
  timeout: number;
  failurePolicy: 'retry' | 'escalate' | 'abort';
}
