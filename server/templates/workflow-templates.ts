export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Finance' | 'HR' | 'Operations' | 'Security' | 'Compliance' | 'IT' | 'Document Processing' | 'General';
  tags: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  icon: string;
  nodes: any[];
  edges: any[];
  triggers: string[];
  defaultConfig?: Record<string, any>;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'invoice-approval-flow',
    name: 'Invoice Approval Workflow',
    description: 'Automated invoice processing with OCR extraction, validation, and approval routing based on amount thresholds.',
    category: 'Finance',
    tags: ['invoice', 'approval', 'ocr', 'finance'],
    complexity: 'intermediate',
    estimatedTime: '5-10 min',
    icon: '💰',
    triggers: ['invoice_uploaded', 'email_received'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'Manual Trigger',
        name: 'Invoice Upload',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'ocr-1',
        type: 'OCR',
        name: 'Extract Invoice Data',
        position: { x: 400, y: 200 },
        config: {
          language: 'Auto-detect',
          dpi: 300,
          preprocessImage: true,
          outputFormat: 'Structured JSON',
        },
      },
      {
        id: 'invoice-1',
        type: 'Invoice Processor',
        name: 'Validate Invoice',
        position: { x: 700, y: 200 },
        config: {
          extractFields: ['Invoice Number', 'Date', 'Vendor', 'Amount', 'Tax'],
          validateAmount: true,
          requireApproval: 5000,
        },
      },
      {
        id: 'condition-1',
        type: 'If/Else',
        name: 'Check Amount',
        position: { x: 1000, y: 200 },
        config: {
          condition: 'invoice.amount > 5000',
          operator: 'greater than',
          value: '5000',
        },
      },
      {
        id: 'approval-1',
        type: 'Approval',
        name: 'Finance Manager Approval',
        position: { x: 1300, y: 100 },
        config: {
          title: 'Invoice Approval Required',
          description: 'Please review and approve this invoice',
          assignedTo: 'finance-manager',
          priority: 'high',
          deadline: '24h',
          requireComment: true,
        },
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Save to Database',
        position: { x: 1600, y: 200 },
        config: {
          table: 'invoices',
          operation: 'Insert',
          dataPath: 'context.invoice',
        },
      },
      {
        id: 'notify-1',
        type: 'Notification',
        name: 'Send Confirmation',
        position: { x: 1900, y: 200 },
        config: {
          title: 'Invoice Processed',
          message: 'Invoice has been successfully processed',
          priority: 'Normal',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'ocr-1' },
      { id: 'e2', fromNodeId: 'ocr-1', toNodeId: 'invoice-1' },
      { id: 'e3', fromNodeId: 'invoice-1', toNodeId: 'condition-1' },
      { id: 'e4', fromNodeId: 'condition-1', toNodeId: 'approval-1', condition: 'true' },
      { id: 'e5', fromNodeId: 'condition-1', toNodeId: 'save-1', condition: 'false' },
      { id: 'e6', fromNodeId: 'approval-1', toNodeId: 'save-1' },
      { id: 'e7', fromNodeId: 'save-1', toNodeId: 'notify-1' },
    ],
  },
  {
    id: 'meeting-intelligence',
    name: 'Meeting Intelligence Workflow',
    description: 'Process meeting transcripts to extract action items, decisions, and sentiment analysis.',
    category: 'Operations',
    tags: ['meeting', 'transcript', 'ai', 'productivity'],
    complexity: 'intermediate',
    estimatedTime: '3-5 min',
    icon: '🎯',
    triggers: ['transcript_uploaded', 'meeting_ended'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'Manual Trigger',
        name: 'Transcript Upload',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'llm-1',
        type: 'LLM Reasoning',
        name: 'Extract Meeting Insights',
        position: { x: 400, y: 200 },
        config: {
          model: 'llama-3.3-70b',
          prompt: 'Extract action items, decisions, attendees, and sentiment from this meeting transcript. Return structured JSON.',
          temperature: 0.3,
          maxTokens: 3000,
          includeContext: true,
        },
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Save Meeting Data',
        position: { x: 700, y: 200 },
        config: {
          table: 'meetings',
          operation: 'Insert',
          dataPath: 'context.meetingData',
        },
      },
      {
        id: 'loop-1',
        type: 'Loop',
        name: 'Process Action Items',
        position: { x: 1000, y: 200 },
        config: {
          arrayPath: 'context.actionItems',
          maxIterations: 50,
          parallel: false,
        },
      },
      {
        id: 'notify-1',
        type: 'Notification',
        name: 'Notify Assignees',
        position: { x: 1300, y: 200 },
        config: {
          title: 'New Action Item Assigned',
          message: 'You have been assigned a new action item from the meeting',
          priority: 'Normal',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'llm-1' },
      { id: 'e2', fromNodeId: 'llm-1', toNodeId: 'save-1' },
      { id: 'e3', fromNodeId: 'save-1', toNodeId: 'loop-1' },
      { id: 'e4', fromNodeId: 'loop-1', toNodeId: 'notify-1' },
    ],
  },
  {
    id: 'document-classification',
    name: 'Document Classification Flow',
    description: 'Automatically classify incoming documents using AI and route to appropriate departments.',
    category: 'Document Processing',
    tags: ['document', 'classification', 'ai', 'routing'],
    complexity: 'beginner',
    estimatedTime: '2-4 min',
    icon: '📄',
    triggers: ['document_uploaded'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'Manual Trigger',
        name: 'Document Upload',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'ocr-1',
        type: 'OCR',
        name: 'Extract Text',
        position: { x: 400, y: 200 },
        config: {
          language: 'Auto-detect',
          dpi: 300,
          preprocessImage: true,
          outputFormat: 'Plain Text',
        },
      },
      {
        id: 'classify-1',
        type: 'Classification',
        name: 'Classify Document',
        position: { x: 700, y: 200 },
        config: {
          categories: ['invoice', 'contract', 'receipt', 'letter', 'report'],
        },
      },
      {
        id: 'switch-1',
        type: 'Switch',
        name: 'Route by Type',
        position: { x: 1000, y: 200 },
        config: {
          field: 'documentType',
        },
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Archive Document',
        position: { x: 1300, y: 200 },
        config: {
          table: 'documents',
          operation: 'Insert',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'ocr-1' },
      { id: 'e2', fromNodeId: 'ocr-1', toNodeId: 'classify-1' },
      { id: 'e3', fromNodeId: 'classify-1', toNodeId: 'switch-1' },
      { id: 'e4', fromNodeId: 'switch-1', toNodeId: 'save-1' },
    ],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding Automation',
    description: 'Streamline new employee onboarding with automated task assignments, account provisioning, and welcome notifications.',
    category: 'HR',
    tags: ['hr', 'onboarding', 'automation', 'employee'],
    complexity: 'advanced',
    estimatedTime: '10-15 min',
    icon: '👥',
    triggers: ['employee_hired'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'Manual Trigger',
        name: 'New Hire Event',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Create Employee Record',
        position: { x: 400, y: 200 },
        config: {
          table: 'employees',
          operation: 'Insert',
          dataPath: 'context.employee',
        },
      },
      {
        id: 'parallel-1',
        type: 'Parallel',
        name: 'Parallel Tasks',
        position: { x: 700, y: 200 },
        config: {},
      },
      {
        id: 'task-1',
        type: 'Task Assignment',
        name: 'Assign IT Setup',
        position: { x: 1000, y: 100 },
        config: {
          title: 'Setup IT accounts',
          assignTo: 'it-manager',
        },
      },
      {
        id: 'task-2',
        type: 'Task Assignment',
        name: 'Assign HR Paperwork',
        position: { x: 1000, y: 200 },
        config: {
          title: 'Process HR documents',
          assignTo: 'hr-director',
        },
      },
      {
        id: 'task-3',
        type: 'Task Assignment',
        name: 'Setup Workspace',
        position: { x: 1000, y: 300 },
        config: {
          title: 'Prepare workspace',
          assignTo: 'facilities',
        },
      },
      {
        id: 'notify-1',
        type: 'Notification',
        name: 'Welcome Email',
        position: { x: 1300, y: 200 },
        config: {
          title: 'Welcome to the Team!',
          message: 'Welcome email with onboarding information',
          priority: 'High',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'save-1' },
      { id: 'e2', fromNodeId: 'save-1', toNodeId: 'parallel-1' },
      { id: 'e3', fromNodeId: 'parallel-1', toNodeId: 'task-1' },
      { id: 'e4', fromNodeId: 'parallel-1', toNodeId: 'task-2' },
      { id: 'e5', fromNodeId: 'parallel-1', toNodeId: 'task-3' },
      { id: 'e6', fromNodeId: 'task-1', toNodeId: 'notify-1' },
      { id: 'e7', fromNodeId: 'task-2', toNodeId: 'notify-1' },
      { id: 'e8', fromNodeId: 'task-3', toNodeId: 'notify-1' },
    ],
  },
  {
    id: 'security-incident-response',
    name: 'Security Incident Response',
    description: 'Automated security incident detection, escalation, and response coordination.',
    category: 'Security',
    tags: ['security', 'incident', 'alert', 'compliance'],
    complexity: 'advanced',
    estimatedTime: '8-12 min',
    icon: '🔒',
    triggers: ['security_alert', 'anomaly_detected'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'API Trigger',
        name: 'Security Alert',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'risk-1',
        type: 'Risk Analysis',
        name: 'Assess Severity',
        position: { x: 400, y: 200 },
        config: {
          factors: ['severity', 'affected_systems', 'data_exposure'],
        },
      },
      {
        id: 'condition-1',
        type: 'If/Else',
        name: 'Critical Incident?',
        position: { x: 700, y: 200 },
        config: {
          condition: 'risk.score > 8',
          operator: 'greater than',
          value: '8',
        },
      },
      {
        id: 'notify-1',
        type: 'Notification',
        name: 'Alert Security Team',
        position: { x: 1000, y: 100 },
        config: {
          title: 'CRITICAL Security Incident',
          message: 'Immediate attention required',
          priority: 'Critical',
        },
      },
      {
        id: 'approval-1',
        type: 'Approval',
        name: 'Approval to Isolate',
        position: { x: 1300, y: 100 },
        config: {
          title: 'System Isolation Approval',
          description: 'Approve system isolation to contain threat',
          assignedTo: 'ceo',
          priority: 'critical',
          deadline: '15m',
        },
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Log Incident',
        position: { x: 1000, y: 300 },
        config: {
          table: 'security_incidents',
          operation: 'Insert',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'risk-1' },
      { id: 'e2', fromNodeId: 'risk-1', toNodeId: 'condition-1' },
      { id: 'e3', fromNodeId: 'condition-1', toNodeId: 'notify-1', condition: 'true' },
      { id: 'e4', fromNodeId: 'notify-1', toNodeId: 'approval-1' },
      { id: 'e5', fromNodeId: 'condition-1', toNodeId: 'save-1', condition: 'false' },
      { id: 'e6', fromNodeId: 'approval-1', toNodeId: 'save-1' },
    ],
  },
  {
    id: 'expense-report-review',
    name: 'Expense Report Review',
    description: 'Automated expense report validation, policy compliance checking, and approval workflow.',
    category: 'Finance',
    tags: ['expense', 'finance', 'approval', 'compliance'],
    complexity: 'intermediate',
    estimatedTime: '5-8 min',
    icon: '💳',
    triggers: ['expense_submitted'],
    nodes: [
      {
        id: 'trigger-1',
        type: 'Manual Trigger',
        name: 'Expense Submitted',
        position: { x: 100, y: 200 },
        config: {},
      },
      {
        id: 'validation-1',
        type: 'Validation',
        name: 'Check Policy Compliance',
        position: { x: 400, y: 200 },
        config: {
          rules: ['receipt_required', 'within_budget', 'valid_category'],
        },
      },
      {
        id: 'llm-1',
        type: 'LLM Reasoning',
        name: 'Anomaly Detection',
        position: { x: 700, y: 200 },
        config: {
          model: 'llama-3.3-70b',
          prompt: 'Analyze this expense report for unusual patterns or policy violations',
          temperature: 0.2,
          maxTokens: 1000,
        },
      },
      {
        id: 'approval-1',
        type: 'Approval',
        name: 'Manager Approval',
        position: { x: 1000, y: 200 },
        config: {
          title: 'Expense Report Approval',
          description: 'Review and approve employee expense report',
          assignedTo: 'finance-manager',
          priority: 'medium',
          deadline: '48h',
        },
      },
      {
        id: 'save-1',
        type: 'Save Data',
        name: 'Update Expense Status',
        position: { x: 1300, y: 200 },
        config: {
          table: 'expenses',
          operation: 'Update',
        },
      },
      {
        id: 'notify-1',
        type: 'Notification',
        name: 'Notify Employee',
        position: { x: 1600, y: 200 },
        config: {
          title: 'Expense Report Status',
          message: 'Your expense report has been processed',
          priority: 'Normal',
        },
      },
    ],
    edges: [
      { id: 'e1', fromNodeId: 'trigger-1', toNodeId: 'validation-1' },
      { id: 'e2', fromNodeId: 'validation-1', toNodeId: 'llm-1' },
      { id: 'e3', fromNodeId: 'llm-1', toNodeId: 'approval-1' },
      { id: 'e4', fromNodeId: 'approval-1', toNodeId: 'save-1' },
      { id: 'e5', fromNodeId: 'save-1', toNodeId: 'notify-1' },
    ],
  },
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return workflowTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.category === category);
};

export const getTemplatesByTag = (tag: string): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.tags.includes(tag));
};

export const getTemplatesByComplexity = (complexity: 'beginner' | 'intermediate' | 'advanced'): WorkflowTemplate[] => {
  return workflowTemplates.filter(t => t.complexity === complexity);
};
