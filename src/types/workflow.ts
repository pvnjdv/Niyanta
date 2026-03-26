export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNodeInstance[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'disabled';
  category: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNodeInstance {
  instanceId: string;
  nodeType: string;
  name: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  condition?: string;
}
