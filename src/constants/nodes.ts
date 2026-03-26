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
    color: '#2196F3',
    icon: '▶',
    nodes: [
      {
        type: 'manual_trigger',
        name: 'Manual Trigger',
        description: 'Manually start the workflow',
        icon: '👆',
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Trigger from external HTTP request',
        icon: '🔗',
      },
      {
        type: 'schedule',
        name: 'Schedule',
        description: 'Trigger on a schedule',
        icon: '⏰',
      },
      {
        type: 'form_submission',
        name: 'Form Submission',
        description: 'Trigger on form submission',
        icon: '📝',
      },
    ],
  },
  {
    id: 'ai_nodes',
    name: 'AI & Analysis',
    description: 'Leverage AI capabilities',
    color: '#FF9800',
    icon: '🤖',
    nodes: [
      {
        type: 'llm_analysis',
        name: 'LLM Analysis',
        description: 'Analyze data using LLM',
        icon: '🧠',
      },
      {
        type: 'classification',
        name: 'Classification',
        description: 'Classify content with LLM',
        icon: '📊',
      },
      {
        type: 'summarization',
        name: 'Summarization',
        description: 'Summarize content',
        icon: '📄',
      },
    ],
  },
  {
    id: 'decisions',
    name: 'Decisions',
    description: 'Control workflow flow',
    color: '#9C27B0',
    icon: '🔀',
    nodes: [
      {
        type: 'condition',
        name: 'Condition',
        description: 'Branch based on condition',
        icon: '❓',
      },
      {
        type: 'approval',
        name: 'Approval',
        description: 'Wait for approval',
        icon: '✅',
      },
      {
        type: 'approval_chain',
        name: 'Approval Chain',
        description: 'Multi-step approval process',
        icon: '🔗',
      },
    ],
  },
  {
    id: 'actions',
    name: 'Actions',
    description: 'Perform operations',
    color: '#4CAF50',
    icon: '⚡',
    nodes: [
      {
        type: 'notification',
        name: 'Notification',
        description: 'Send notification (email/slack)',
        icon: '📬',
      },
      {
        type: 'database_write',
        name: 'Database Write',
        description: 'Write to database',
        icon: '💾',
      },
      {
        type: 'api_call',
        name: 'API Call',
        description: 'Call external API',
        icon: '🌐',
      },
      {
        type: 'file_operation',
        name: 'File Operation',
        description: 'Create, read, or modify files',
        icon: '📁',
      },
    ],
  },
  {
    id: 'data',
    name: 'Data',
    description: 'Transform and store data',
    color: '#00BCD4',
    icon: '🔄',
    nodes: [
      {
        type: 'data_transformation',
        name: 'Data Transformation',
        description: 'Transform data format',
        icon: '🔄',
      },
      {
        type: 'data_storage',
        name: 'Data Storage',
        description: 'Store data in cache',
        icon: '💾',
      },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring & Audit',
    description: 'Track and monitor',
    color: '#FF5722',
    icon: '📡',
    nodes: [
      {
        type: 'metrics_collection',
        name: 'Metrics Collection',
        description: 'Collect workflow metrics',
        icon: '📊',
      },
      {
        type: 'audit_log',
        name: 'Audit Log',
        description: 'Log audit trail',
        icon: '📋',
      },
    ],
  },
  {
    id: 'utility',
    name: 'Utility',
    description: 'Utility operations',
    color: '#607D8B',
    icon: '🛠',
    nodes: [
      {
        type: 'delay',
        name: 'Delay',
        description: 'Add delay to workflow',
        icon: '⏱',
      },
      {
        type: 'debug',
        name: 'Debug',
        description: 'Debug workflow',
        icon: '🐛',
      },
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
