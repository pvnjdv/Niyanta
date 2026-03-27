// Node categories and type definitions for N8N-style workflow builder

export interface NodeDefinition {
  type: string;
  name: string;
  description: string;
  icon?: string;
}

export interface NodeGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  nodes: NodeDefinition[];
}

export const NODE_GROUPS: NodeGroup[] = [
  {
    id: 'triggers',
    name: 'Triggers',
    description: 'Start your workflow',
    color: '#666',
    icon: '▶',
    nodes: [
      { type: 'manual_trigger', name: 'Manual Trigger', description: 'Manually start the workflow', icon: '▶' },
      { type: 'webhook', name: 'Webhook', description: 'Trigger from external HTTP request', icon: '⇄' },
      { type: 'schedule', name: 'Schedule', description: 'Trigger on a cron schedule', icon: '◷' },
      { type: 'form_submission', name: 'Form Submission', description: 'Trigger on form submission', icon: '▤' },
      { type: 'api_trigger', name: 'API Trigger', description: 'Trigger from internal API event', icon: '⚡' },
      { type: 'file_upload_trigger', name: 'File Upload', description: 'Trigger on file upload', icon: '⇪' },
      { type: 'timer_trigger', name: 'Timer Trigger', description: 'Trigger after a delay', icon: '◔' },
    ],
  },
  {
    id: 'ai_nodes',
    name: 'AI & Analysis',
    description: 'Leverage AI capabilities',
    color: '#777',
    icon: '◈',
    nodes: [
      { type: 'llm_analysis', name: 'LLM Analysis', description: 'Analyze data using LLM', icon: '◈' },
      { type: 'classification', name: 'Classification', description: 'Classify content with LLM', icon: '▥' },
      { type: 'summarization', name: 'Summarization', description: 'Summarize content', icon: '▤' },
      { type: 'risk_analysis', name: 'Risk Analysis', description: 'Evaluate risk levels with AI', icon: '⚠' },
      { type: 'decision_generation', name: 'Decision Generation', description: 'Generate AI-powered decisions', icon: '◎' },
    ],
  },
  {
    id: 'agents',
    name: 'Agent Operations',
    description: 'Inter-agent communication',
    color: '#888',
    icon: '◉',
    nodes: [
      { type: 'agent_invoke', name: 'Invoke Agent', description: 'Run another agent within workflow', icon: '◉' },
      { type: 'agent_message', name: 'Agent Message', description: 'Send message between agents', icon: '◇' },
    ],
  },
  {
    id: 'decisions',
    name: 'Flow Control',
    description: 'Control workflow flow',
    color: '#999',
    icon: '◇',
    nodes: [
      { type: 'condition', name: 'Condition', description: 'Branch based on condition', icon: '◇' },
      { type: 'conditional_routing', name: 'Conditional Routing', description: 'Route to different paths', icon: '⇢' },
      { type: 'approval', name: 'Approval', description: 'Wait for human approval', icon: '✓' },
      { type: 'approval_chain', name: 'Approval Chain', description: 'Multi-step approval process', icon: '⇉' },
      { type: 'threshold_decision', name: 'Threshold Decision', description: 'Decision based on thresholds', icon: '⊟' },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    description: 'Perform operations',
    color: '#AAA',
    icon: '▪',
    nodes: [
      { type: 'notification', name: 'Notification', description: 'Send notification (email/slack/webhook)', icon: '▸' },
      { type: 'api_call', name: 'API Call', description: 'Call external API endpoint', icon: '⇄' },
      { type: 'file_operation', name: 'File Operation', description: 'Create, read, or modify files', icon: '▦' },
      { type: 'database_write', name: 'Database Write', description: 'Write data to database', icon: '⊞' },
      { type: 'task_assignment', name: 'Task Assignment', description: 'Assign task to user or team', icon: '☐' },
      { type: 'invoice_processing', name: 'Invoice Processing', description: 'Process and validate invoices', icon: '▤' },
      { type: 'report_generation', name: 'Report Generation', description: 'Generate formatted reports', icon: '▥' },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    description: 'Transform and store data',
    color: '#BBB',
    icon: '↻',
    nodes: [
      { type: 'data_transformation', name: 'Data Transformation', description: 'Transform data format (map/filter/merge/extract)', icon: '↻' },
      { type: 'data_storage', name: 'Data Storage', description: 'Store data in context cache', icon: '⊞' },
      { type: 'data_retrieval', name: 'Data Retrieval', description: 'Retrieve cached data', icon: '⊟' },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Audit',
    description: 'Track and monitor',
    color: '#CCC',
    icon: '◎',
    nodes: [
      { type: 'metrics_collection', name: 'Metrics Collection', description: 'Collect workflow metrics', icon: '▥' },
      { type: 'audit_log', name: 'Audit Log', description: 'Log audit trail entry', icon: '☐' },
      { type: 'sla_monitoring', name: 'SLA Monitoring', description: 'Monitor SLA compliance', icon: '◷' },
      { type: 'bottleneck_detection', name: 'Bottleneck Detection', description: 'Detect workflow bottlenecks', icon: '◎' },
    ],
  },
  {
    id: 'utility',
    name: 'Utility',
    description: 'Utility operations',
    color: '#DDD',
    icon: '⚙',
    nodes: [
      { type: 'delay', name: 'Delay', description: 'Add delay to workflow', icon: '◔' },
      { type: 'debug', name: 'Debug', description: 'Log debug information', icon: '⊙' },
      { type: 'merge', name: 'Merge', description: 'Merge multiple inputs', icon: '⇉' },
    ],
  },
];

// Flatten all node types for easy lookup
export const ALL_NODE_TYPES: NodeDefinition[] = NODE_GROUPS.reduce(
  (acc, group) => [...acc, ...group.nodes],
  [] as NodeDefinition[]
);

// Map node type to category info
export const NODE_CATEGORIES: Record<string, { group: NodeGroup; node: NodeDefinition }> = {};
NODE_GROUPS.forEach((group) => {
  group.nodes.forEach((node) => {
    NODE_CATEGORIES[node.type] = { group, node };
  });
});

// Get category color for a node type
export const getNodeColor = (nodeType: string): string => {
  return NODE_CATEGORIES[nodeType]?.group.color || '#999';
};

// Get node icon for a node type
export const getNodeIcon = (nodeType: string): string => {
  return NODE_CATEGORIES[nodeType]?.node.icon || '⚙';
};

// Get node name for a node type
export const getNodeName = (nodeType: string): string => {
  return NODE_CATEGORIES[nodeType]?.node.name || nodeType;
};
