import { NodeDefinition } from '../types/node.types';

export class NodeRegistry {
  private definitions: Map<string, NodeDefinition>;

  constructor() {
    this.definitions = new Map();
    this.bootstrap();
  }

  register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition);
  }

  all(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  get(type: string): NodeDefinition | undefined {
    return this.definitions.get(type);
  }

  private bootstrap(): void {
    const nodes: NodeDefinition[] = [
      // ── Triggers ──
      { type: 'manual_trigger', name: 'Manual Trigger', category: 'trigger', description: 'Start workflow manually from UI/API.', configSchema: { fields: [] } },
      { type: 'webhook', name: 'Webhook', category: 'trigger', description: 'Trigger from external HTTP request.', configSchema: { fields: [{ key: 'endpoint', label: 'Endpoint', type: 'text', required: false }, { key: 'method', label: 'Method', type: 'select', required: false, options: ['GET', 'POST', 'PUT'] }] } },
      { type: 'schedule', name: 'Schedule', category: 'trigger', description: 'Trigger on a cron schedule.', configSchema: { fields: [{ key: 'cron', label: 'Cron Expression', type: 'text', required: true }] } },
      { type: 'form_submission', name: 'Form Submission', category: 'trigger', description: 'Trigger on form submission.', configSchema: { fields: [] } },
      { type: 'api_trigger', name: 'API Trigger', category: 'trigger', description: 'Trigger from internal API event.', configSchema: { fields: [{ key: 'method', label: 'Method', type: 'select', required: false, options: ['GET', 'POST'] }, { key: 'path', label: 'Path', type: 'text', required: false }] } },
      { type: 'file_upload_trigger', name: 'File Upload', category: 'trigger', description: 'Trigger on file upload.', configSchema: { fields: [{ key: 'acceptedTypes', label: 'Accepted Types', type: 'text', required: false }] } },
      { type: 'timer_trigger', name: 'Timer Trigger', category: 'trigger', description: 'Trigger after a delay.', configSchema: { fields: [{ key: 'cron', label: 'Cron Expression', type: 'text', required: false }, { key: 'timezone', label: 'Timezone', type: 'text', required: false }] } },
      { type: 'meeting_transcript_trigger', name: 'Meeting Transcript', category: 'trigger', description: 'Trigger on meeting transcript input.', configSchema: { fields: [] } },

      // ── AI & Analysis ──
      { type: 'llm_analysis', name: 'LLM Analysis', category: 'ai', description: 'Run LLM analysis on context payload.', configSchema: { fields: [{ key: 'prompt', label: 'Prompt', type: 'textarea', required: true }, { key: 'model', label: 'Model', type: 'text', required: false }] } },
      { type: 'classification', name: 'Classification', category: 'ai', description: 'Classify content with LLM.', configSchema: { fields: [{ key: 'categories', label: 'Categories (comma-separated)', type: 'text', required: false }] } },
      { type: 'summarization', name: 'Summarization', category: 'ai', description: 'Summarize content.', configSchema: { fields: [{ key: 'maxLength', label: 'Max Length', type: 'number', required: false }] } },
      { type: 'risk_analysis', name: 'Risk Analysis', category: 'ai', description: 'Evaluate risk levels with AI.', configSchema: { fields: [] } },
      { type: 'decision_generation', name: 'Decision Generation', category: 'ai', description: 'Generate AI-powered decisions.', configSchema: { fields: [{ key: 'criteria', label: 'Criteria', type: 'text', required: false }] } },

      // ── Flow Control / Decision ──
      { type: 'approval', name: 'Approval', category: 'decision', description: 'Pause execution until approver decision.', configSchema: { fields: [{ key: 'title', label: 'Title', type: 'text', required: false }, { key: 'assignedTo', label: 'Assigned To', type: 'text', required: false }, { key: 'priority', label: 'Priority', type: 'select', required: false, options: ['low', 'medium', 'high', 'critical'] }] } },
      { type: 'conditional_routing', name: 'Conditional Routing', category: 'decision', description: 'Route to different paths based on conditions.', configSchema: { fields: [{ key: 'field', label: 'Field', type: 'text', required: true }, { key: 'operator', label: 'Operator', type: 'select', required: true, options: ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains'] }] } },
      { type: 'condition', name: 'Condition', category: 'decision', description: 'Branch based on condition.', configSchema: { fields: [{ key: 'field', label: 'Field', type: 'text', required: true }, { key: 'operator', label: 'Operator', type: 'select', required: true, options: ['eq', 'neq', 'gt', 'lt', 'contains'] }] } },
      { type: 'threshold_decision', name: 'Threshold Decision', category: 'decision', description: 'Decision based on numeric thresholds.', configSchema: { fields: [{ key: 'threshold', label: 'Threshold', type: 'number', required: true }] } },
      { type: 'approval_chain', name: 'Approval Chain', category: 'decision', description: 'Multi-step approval process.', configSchema: { fields: [{ key: 'approvers', label: 'Approvers (comma-separated)', type: 'text', required: true }] } },
      { type: 'rule_engine', name: 'Rule Engine', category: 'decision', description: 'Evaluate business rules.', configSchema: { fields: [{ key: 'rules', label: 'Rules JSON', type: 'textarea', required: true }] } },

      // ── Actions ──
      { type: 'notification', name: 'Notification', category: 'action', description: 'Send summary notification to stakeholders.', configSchema: { fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['email', 'slack', 'webhook', 'internal'] }, { key: 'message', label: 'Message', type: 'textarea', required: false }] } },
      { type: 'api_call', name: 'API Call', category: 'action', description: 'Call external API endpoint.', configSchema: { fields: [{ key: 'url', label: 'URL', type: 'text', required: true }, { key: 'method', label: 'Method', type: 'select', required: true, options: ['GET', 'POST', 'PUT', 'DELETE'] }] } },
      { type: 'file_operation', name: 'File Operation', category: 'action', description: 'Create, read, or modify files.', configSchema: { fields: [{ key: 'operation', label: 'Operation', type: 'select', required: true, options: ['read', 'write', 'delete'] }] } },
      { type: 'database_write', name: 'Database Write', category: 'action', description: 'Write data to database.', configSchema: { fields: [{ key: 'table', label: 'Table', type: 'text', required: true }] } },
      { type: 'task_assignment', name: 'Task Assignment', category: 'action', description: 'Assign task to user or team.', configSchema: { fields: [{ key: 'assignee', label: 'Assignee', type: 'text', required: true }] } },
      { type: 'invoice_processing', name: 'Invoice Processing', category: 'action', description: 'Process and validate invoices.', configSchema: { fields: [] } },
      { type: 'report_generation', name: 'Report Generation', category: 'action', description: 'Generate formatted reports.', configSchema: { fields: [{ key: 'format', label: 'Format', type: 'select', required: false, options: ['pdf', 'csv', 'excel', 'json'] }] } },
      { type: 'purchase_order', name: 'Purchase Order', category: 'action', description: 'Create purchase order.', configSchema: { fields: [] } },
      { type: 'payment', name: 'Payment', category: 'action', description: 'Process payment.', configSchema: { fields: [] } },

      // ── Data ──
      { type: 'data_transformation', name: 'Data Transformation', category: 'data', description: 'Transform data format (map/filter/merge/extract).', configSchema: { fields: [{ key: 'operation', label: 'Operation', type: 'select', required: false, options: ['map', 'filter', 'merge', 'extract'] }] } },
      { type: 'data_storage', name: 'Data Storage', category: 'data', description: 'Store data in context cache.', configSchema: { fields: [{ key: 'key', label: 'Cache Key', type: 'text', required: true }] } },
      { type: 'data_retrieval', name: 'Data Retrieval', category: 'data', description: 'Retrieve cached data.', configSchema: { fields: [{ key: 'key', label: 'Cache Key', type: 'text', required: true }] } },
      { type: 'ocr', name: 'OCR', category: 'data', description: 'Extract text from images/documents.', configSchema: { fields: [] } },
      { type: 'validation', name: 'Validation', category: 'data', description: 'Validate data fields.', configSchema: { fields: [] } },

      // ── Monitoring & Audit ──
      { type: 'metrics_collection', name: 'Metrics Collection', category: 'monitoring', description: 'Collect workflow metrics.', configSchema: { fields: [] } },
      { type: 'audit_log', name: 'Audit Log', category: 'audit', description: 'Log audit trail entry.', configSchema: { fields: [{ key: 'action', label: 'Action', type: 'text', required: false }] } },
      { type: 'sla_monitoring', name: 'SLA Monitoring', category: 'monitoring', description: 'Monitor SLA compliance.', configSchema: { fields: [{ key: 'maxDuration', label: 'Max Duration (ms)', type: 'number', required: false }] } },
      { type: 'bottleneck_detection', name: 'Bottleneck Detection', category: 'monitoring', description: 'Detect workflow bottlenecks.', configSchema: { fields: [] } },
      { type: 'health_check', name: 'Health Check', category: 'monitoring', description: 'Run health check.', configSchema: { fields: [] } },
      { type: 'dashboard_update', name: 'Dashboard Update', category: 'monitoring', description: 'Push update to dashboard.', configSchema: { fields: [] } },
      { type: 'audit_storage', name: 'Audit Storage', category: 'audit', description: 'Store audit data.', configSchema: { fields: [] } },

      // ── Utility ──
      { type: 'delay', name: 'Delay', category: 'utility', description: 'Add delay to workflow.', configSchema: { fields: [{ key: 'duration', label: 'Duration (ms)', type: 'number', required: true }] } },
      { type: 'debug', name: 'Debug', category: 'utility', description: 'Log debug information.', configSchema: { fields: [] } },
      { type: 'merge', name: 'Merge', category: 'utility', description: 'Merge multiple inputs.', configSchema: { fields: [] } },
      { type: 'retry', name: 'Retry', category: 'utility', description: 'Retry failed operation.', configSchema: { fields: [{ key: 'maxRetries', label: 'Max Retries', type: 'number', required: false }] } },
      { type: 'workflow_completion', name: 'Workflow Completion', category: 'utility', description: 'Mark workflow as complete.', configSchema: { fields: [] } },

      // ── Agent ──
      { type: 'agent_invoke', name: 'Invoke Agent', category: 'action', description: 'Run another agent within workflow.', configSchema: { fields: [{ key: 'agentId', label: 'Agent ID', type: 'text', required: true }] } },
      { type: 'agent_message', name: 'Agent Message', category: 'action', description: 'Send message between agents.', configSchema: { fields: [{ key: 'toAgent', label: 'To Agent', type: 'text', required: true }, { key: 'messageType', label: 'Message Type', type: 'text', required: false }] } },
    ];

    nodes.forEach((n) => this.register(n));
  }
}
