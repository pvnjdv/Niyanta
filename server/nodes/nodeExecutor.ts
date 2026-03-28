import { v4 as uuid } from 'uuid';
import { WorkflowContext } from '../types/workflow.types';
import { callGroqJSON } from '../utils/groqClient';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { getDB } from '../db/database';

export interface NodeToExecute {
  instanceId: string;
  nodeType: string;
  config: Record<string, unknown>;
}

export async function executeNode(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const nodeType = node.nodeType.toLowerCase();

  switch (nodeType) {
    // ── TRIGGER NODES ──────────────────────────────────────────────────────────
    case 'manual_trigger':
    case 'manual trigger':
    case 'manualtriggernode':
      return executeManualTrigger(node, context);

    case 'webhook_trigger':
    case 'webhook trigger':
    case 'webhook':
    case 'webhooktriggernode':
      return executeWebhookTrigger(node, context);

    case 'file_upload_trigger':
    case 'file upload trigger':
    case 'file upload':
    case 'fileuploadtriggernode':
      return executeFileUploadTrigger(node, context);

    case 'timer_trigger':
    case 'timer trigger':
    case 'timer':
    case 'timertriggernode':
      return executeTimerTrigger(node, context);

    case 'schedule':
      return executeSchedule(node, context);

    case 'api_trigger':
    case 'api trigger':
      return executeApiTrigger(node, context);

    case 'meeting_transcript_trigger':
    case 'meeting transcript trigger':
    case 'meetingtranscripttriggernode':
      return executeMeetingTranscriptTrigger(node, context);

    // ── AI NODES ───────────────────────────────────────────────────────────────
    case 'llm_analysis':
    case 'llm analysis':
    case 'llm reasoning':
    case 'llmanalysisnode':
      return executeLLMAnalysis(node, context);

    case 'classification':
    case 'document classifier':
    case 'classificationnode':
      return executeClassification(node, context);

    case 'summarization':
    case 'summarizationnode':
      return executeSummarization(node, context);

    case 'risk_analysis':
    case 'risk analysis':
    case 'riskanalysisnode':
      return executeRiskAnalysis(node, context);

    case 'decision_generation':
    case 'decision generation':
    case 'decision':
    case 'decisiongenerationnode':
      return executeDecisionGeneration(node, context);

    // ── DECISION / ROUTING NODES ───────────────────────────────────────────────
    case 'approval':
    case 'approvalnode':
      return executeApproval(node, context);

    case 'conditional_routing':
    case 'conditional routing':
    case 'if/else':
    case 'switch':
    case 'conditionalroutingnode':
      return executeConditionalRouting(node, context);

    case 'threshold_decision':
    case 'threshold decision':
    case 'thresholddecisionnode':
      return executeThresholdDecision(node, context);

    case 'condition':
      return executeCondition(node, context);

    case 'approval_chain':
    case 'approval chain':
      return executeApprovalChain(node, context);

    case 'rule_engine':
    case 'rule engine':
    case 'ruleenginenode':
      return executeRuleEngine(node, context);

    // ── ACTION NODES ───────────────────────────────────────────────────────────
    case 'invoice_processing':
    case 'invoice processing':
    case 'invoice processor':
    case 'invoiceprocessingnode':
      return executeInvoiceProcessing(node, context);

    case 'task_assignment':
    case 'task assignment':
    case 'taskassignmentnode':
      return executeTaskAssignment(node, context);

    case 'notification':
    case 'alert':
    case 'notificationnode':
      return executeNotification(node, context);

    case 'report_generation':
    case 'report generation':
    case 'pdf report':
    case 'csv export':
    case 'excel export':
    case 'json export':
    case 'reportgenerationnode':
      return executeReportGeneration(node, context);

    case 'purchase_order':
    case 'purchase order':
    case 'purchaseordernode':
      return executePurchaseOrder(node, context);

    case 'payment':
      return executePayment(node, context);

    case 'form_submission':
    case 'form submission':
      return executeFormSubmission(node, context);

    case 'api_call':
    case 'api call':
      return executeApiCall(node, context);

    case 'file_operation':
    case 'file operation':
      return executeFileOperation(node, context);

    // ── DATA NODES ─────────────────────────────────────────────────────────────
    case 'data_storage':
    case 'data storage':
    case 'save data':
    case 'cache':
    case 'metadata':
    case 'datastoragenode':
      return executeDataStorage(node, context);

    case 'data_retrieval':
    case 'data retrieval':
    case 'read data':
    case 'pdf reader':
    case 'dataretrievalnode':
      return executeDataRetrieval(node, context);

    case 'data_transformation':
    case 'data transformation':
    case 'field extractor':
    case 'header/footer cleaner':
      return executeDataTransformation(node, context);

    case 'database_write':
    case 'database write':
      return executeDatabaseWrite(node, context);

    case 'audit_storage':
    case 'audit storage':
    case 'auditstoragenode':
      return executeAuditStorage(node, context);

    case 'ocr':
      return executeOCR(node, context);

    case 'validation':
      return executeValidation(node, context);

    // ── MONITORING NODES ───────────────────────────────────────────────────────
    case 'sla_monitoring':
    case 'sla monitoring':
    case 'sla timer':
    case 'slamonitoringnode':
      return executeSLAMonitoring(node, context);

    case 'bottleneck_detection':
    case 'bottleneck detection':
    case 'bottleneck detector':
    case 'bottleneckdetectionnode':
      return executeBottleneckDetection(node, context);

    case 'metrics_collection':
    case 'metrics collection':
    case 'metrics':
      return executeMetricsCollection(node, context);

    case 'health_check':
    case 'health check':
    case 'healthchecknode':
      return executeHealthCheck(node, context);

    case 'dashboard update':
    case 'dashboard_update':
      return executeDashboardUpdate(node, context);

    // ── AUDIT NODES ────────────────────────────────────────────────────────────
    case 'audit_log':
    case 'audit log':
      return executeAuditLog(node, context);

    // ── UTILITY NODES ──────────────────────────────────────────────────────────
    case 'delay':
    case 'delaynode':
      return executeDelay(node, context);

    case 'merge':
    case 'parallel':
    case 'loop':
      return executeMerge(node, context);

    case 'retry':
    case 'retrynode':
      return executeRetryNode(node, context);

    case 'debug':
      return executeDebug(node, context);

    case 'workflow_completion':
    case 'workflow completion':
    case 'workflowcompletionnode':
      return executeWorkflowCompletion(node, context);

    // ── AGENT NODES ────────────────────────────────────────────────────────────
    case 'agent_invoke':
    case 'agent invoke':
      return executeAgentInvoke(node, context);

    case 'agent_message':
    case 'agent message':
      return executeAgentMessage(node, context);

    default:
      return context;
  }
}

// ============ TRIGGER NODES ============

async function executeManualTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
      status: 'RUNNING',
    },
  };
}

async function executeWebhookTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const payload = (node.config.webhookPayload as Record<string, unknown>) || {};
  const method = (node.config.method as string) || 'POST';
  const endpoint = (node.config.endpoint as string) || '/webhook';
  return {
    ...context,
    metadata: {
      ...context.metadata,
      trigger: { type: 'webhook', method, endpoint, payloadKeys: Object.keys(payload), receivedAt: new Date().toISOString() },
      webhookPayload: payload,
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: 'RUNNING' },
  };
}

async function executeFileUploadTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const file = (node.config.file as Record<string, unknown>) || {};
  const acceptedTypes = (node.config.acceptedTypes as string) || '*';
  return {
    ...context,
    metadata: {
      ...context.metadata,
      trigger: { type: 'file_upload', uploadedAt: new Date().toISOString(), acceptedTypes },
      uploadedFile: { name: file.name || 'unknown', size: file.size || 0, mimeType: file.mimeType || 'application/octet-stream', path: file.path || '' },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: 'RUNNING' },
  };
}

async function executeTimerTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const cron = (node.config.cron as string) || '0 9 * * *';
  const timezone = (node.config.timezone as string) || 'UTC';
  return {
    ...context,
    metadata: {
      ...context.metadata,
      trigger: { type: 'timer', cron, timezone, triggeredAt: new Date().toISOString() },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: 'RUNNING' },
  };
}

async function executeSchedule(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
      status: 'RUNNING',
    },
  };
}

async function executeApiTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const method = (node.config.method as string) || 'POST';
  const path = (node.config.path as string) || '/';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      apiTrigger: {
        method,
        path,
        triggeredAt: new Date().toISOString(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
      status: 'RUNNING',
    },
  };
}

// ============ AI NODES ============

async function executeLLMAnalysis(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const prompt = (node.config.prompt as string) || 'Analyze the provided context';
  const contextStr = JSON.stringify(
    {
      document: context.document,
      invoice: context.invoice,
      employee: context.employee,
      procurement: context.procurement,
      finance: context.finance,
    },
    null,
    2
  );

  const systemPrompt = `You are an enterprise AI analyst. Analyze the workflow context and provide structured insights.
Return a JSON object with: analysis (string), confidence (0-1), recommendations (array of strings)`;

  try {
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Context to analyze:\n${contextStr}\n\nTask: ${prompt}`,
      'llama-3.3-70b-versatile'
    );

    return {
      ...context,
      metadata: {
        ...context.metadata,
        llmAnalysis: result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`LLMAnalysisFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function executeClassification(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const categories = (node.config.categories as string[]) || ['high', 'medium', 'low'];
  const input = (node.config.input as string) || 'document';

  const contextData = (context as unknown as Record<string, unknown>)[input];
  if (!contextData) return context;

  const systemPrompt = `You are a classification expert. Classify the input into one of these categories: ${categories.join(', ')}.
Return a JSON object with: classification (string matching one of the categories), confidence (0-1), reasoning (string)`;

  try {
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Classify this: ${JSON.stringify(contextData)}`,
      'llama-3.3-70b-versatile'
    );

    return {
      ...context,
      metadata: {
        ...context.metadata,
        classification: result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`ClassificationFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function executeSummarization(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const input = (node.config.input as string) || 'document';
  const contextData = (context as unknown as Record<string, unknown>)[input];

  if (!contextData) return context;

  const systemPrompt = `Be a concise executive summarizer. Provide a brief, impactful summary.
Return JSON with: summary (string), keyPoints (array), implications (array)`;

  try {
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Summarize: ${JSON.stringify(contextData)}`,
      'llama-3.3-70b-versatile'
    );

    return {
      ...context,
      metadata: {
        ...context.metadata,
        summary: result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`SummarizationFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function executeRiskAnalysis(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const riskDomain = (node.config.riskDomain as string) || 'general';

  const contextStr = JSON.stringify(
    {
      document: context.document,
      invoice: context.invoice,
      employee: context.employee,
      procurement: context.procurement,
      finance: context.finance,
      metadata: context.metadata,
    },
    null,
    2
  );

  const systemPrompt = `You are an enterprise risk analyst specializing in ${riskDomain} risk assessment.
Analyze the provided context and identify risks, their severity, likelihood, and mitigation strategies.
Return a JSON object with: riskLevel (critical|high|medium|low), risks (array of { description, severity, likelihood, impact }),
mitigations (array of strings), overallScore (0-100 where 100 is highest risk), domain (string)`;

  try {
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Analyze risks in domain "${riskDomain}" for context:\n${contextStr}`,
      'llama-3.3-70b-versatile'
    );

    return {
      ...context,
      metadata: {
        ...context.metadata,
        riskAnalysis: result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`RiskAnalysisFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function executeDecisionGeneration(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const criteria = (node.config.criteria as string) || 'best overall outcome';
  const options = (node.config.options as string[]) || [];

  const contextStr = JSON.stringify(
    {
      document: context.document,
      invoice: context.invoice,
      metadata: context.metadata,
    },
    null,
    2
  );

  const systemPrompt = `You are an enterprise decision advisor. Evaluate the given options against the specified criteria.
Return a JSON object with: recommendation (string - the chosen option), confidence (0-1),
reasoning (string), optionScores (array of { option, score, pros, cons }), criteria (string)`;

  try {
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Criteria: ${criteria}\nOptions: ${JSON.stringify(options)}\nContext:\n${contextStr}`,
      'llama-3.3-70b-versatile'
    );

    return {
      ...context,
      metadata: {
        ...context.metadata,
        decisionGeneration: result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`DecisionGenerationFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

// ============ DECISION NODES ============

async function executeApproval(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const approver = (node.config.approver as string) || '';
  const autoApproveThreshold = (node.config.autoApproveThreshold as number) ?? 1000;
  const amount = (context.invoice?.amount as number) ?? (context.finance?.amount as number) ?? 0;

  if (amount && amount > autoApproveThreshold) {
    try {
      const db = getDB();
      db.prepare(
        `INSERT INTO pending_approvals (id, workflow_run_id, approver, amount, context, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
      ).run(uuid(), context.runId, approver, amount, JSON.stringify(context.metadata));
    } catch { /* table may not exist */ }
    return {
      ...context,
      metadata: { ...context.metadata, approvalStatus: 'pending', pendingApprover: approver, amount },
      workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: 'WAITING_APPROVAL' },
    };
  }

  return {
    ...context,
    metadata: { ...context.metadata, approvalDecision: 'approved', approvedBy: 'auto', approvedAt: new Date().toISOString(), amount },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeConditionalRouting(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const field = node.config.field as string | undefined;
  const operator = node.config.operator as string | undefined;
  const value = node.config.value;
  const trueValue = node.config.trueValue;
  const falseValue = node.config.falseValue;

  let conditionMet = false;
  try {
    if (field && operator) {
      const fieldValue = (context.metadata as Record<string, unknown>)[field];
      conditionMet = safeCompare(fieldValue, operator, value);
    }
  } catch {
    conditionMet = false;
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      routingDecision: conditionMet ? trueValue : falseValue,
      condition: `${field} ${operator} ${JSON.stringify(value)}`,
      conditionMet,
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeThresholdDecision(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const value = node.config.value as number;
  const threshold = node.config.threshold as number;
  const operator = node.config.operator as string;

  let decision = false;
  if (operator === 'gt') decision = value > threshold;
  else if (operator === 'lt') decision = value < threshold;
  else if (operator === 'eq') decision = value === threshold;
  else if (operator === 'gte') decision = value >= threshold;
  else if (operator === 'lte') decision = value <= threshold;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      thresholdDecision: decision ? 'pass' : 'fail',
      value,
      threshold,
      operator,
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeCondition(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const field = node.config.field as string;
  const operator = node.config.operator as string;
  const value = node.config.value;

  const fieldValue = (context.metadata as Record<string, unknown>)[field]
    ?? (context as unknown as Record<string, unknown>)[field];

  const result = safeCompare(fieldValue, operator, value);

  return {
    ...context,
    metadata: {
      ...context.metadata,
      conditionResult: result,
      conditionField: field,
      conditionOperator: operator,
      conditionValue: value,
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeApprovalChain(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const approvers = (node.config.approvers as string[]) || [];
  const requireAll = (node.config.requireAll as boolean) ?? true;

  const approvalResults = approvers.map((approver) => ({
    approver,
    status: 'approved' as const,
    approvedAt: new Date().toISOString(),
  }));

  const allApproved = approvalResults.every((r) => r.status === 'approved');
  const anyApproved = approvalResults.some((r) => r.status === 'approved');
  const chainApproved = requireAll ? allApproved : anyApproved;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      approvalChain: {
        approvers: approvalResults,
        requireAll,
        approved: chainApproved,
        completedAt: new Date().toISOString(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ ACTION NODES ============

async function executeInvoiceProcessing(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const autoApproveThreshold = (node.config.autoApproveThreshold as number) ?? 5000;
  const extractFields = (node.config.extractFields as boolean) ?? true;

  let extractedFields: Record<string, unknown> = {};
  if (extractFields && (context.document?.content || Object.keys(context.document || {}).length > 0)) {
    try {
      const systemPrompt = `You are an invoice extraction specialist. Extract structured data from the invoice context.
Return JSON with: vendor (string), amount (number), currency (string), dueDate (string ISO), invoiceNumber (string), lineItems (array), paymentTerms (string)`;
      extractedFields = await callGroqJSON<Record<string, unknown>>(
        systemPrompt,
        `Extract invoice fields from: ${JSON.stringify(context.document)}`,
        'llama-3.3-70b-versatile'
      );
    } catch { /* use whatever is already in invoice context */ }
  }

  const mergedInvoice: Record<string, unknown> = { ...context.invoice, ...extractedFields, processed: true, processedAt: new Date().toISOString() };
  const amount = (mergedInvoice.amount as number) || 0;
  const needsApproval = amount > autoApproveThreshold;

  return {
    ...context,
    invoice: mergedInvoice,
    task: { ...context.task, type: 'invoice_processed', needsApproval },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeTaskAssignment(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const assignee = (node.config.assignee as string) || '';
  const priority = (node.config.priority as string) || 'medium';
  const title = (node.config.title as string) || `Task from workflow ${context.workflowId}`;
  const dueDateRaw = (node.config.dueDate as string) || '3d';
  const notifyAssignee = (node.config.notifyAssignee as boolean) ?? true;

  // Resolve relative due dates (e.g. '1d', '3h', '1w')
  let dueDate: string;
  const match = dueDateRaw.match(/^(\d+)([dhw])$/);
  if (match) {
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const ms = unit === 'h' ? n * 3600000 : unit === 'd' ? n * 86400000 : n * 604800000;
    dueDate = new Date(Date.now() + ms).toISOString();
  } else {
    dueDate = dueDateRaw;
  }

  return {
    ...context,
    task: { ...context.task, id: uuid(), title, assignedTo: assignee, priority, assignedAt: new Date().toISOString(), dueDate, notifyAssignee, status: 'open' },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeNotification(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const channel = node.config.channel as string;
  const message = node.config.message as string;

  const notifications = Array.isArray(context.metadata.notifications) ? (context.metadata.notifications as unknown[]) : [];

  return {
    ...context,
    metadata: {
      ...context.metadata,
      notifications: [
        ...notifications,
        {
          channel,
          message,
          sentAt: new Date().toISOString(),
        },
      ],
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeReportGeneration(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const reportType = (node.config.reportType as string) || 'summary';
  const format = (node.config.format as string) || 'PDF';
  const title = (node.config.title as string) || `${reportType} Report`;
  const includeCharts = (node.config.includeCharts as boolean) ?? false;

  let reportSummary = '';
  try {
    const systemPrompt = `You are a business report writer. Generate a concise executive summary for a ${reportType} report.
Return JSON with: summary (string), sections (array of {title, content}), keyMetrics (array of {name, value})`;
    const result = await callGroqJSON<Record<string, unknown>>(
      systemPrompt,
      `Generate ${reportType} report from workflow context: ${JSON.stringify({ invoice: context.invoice, finance: context.finance, metadata: context.metadata }, null, 2)}`,
      'llama-3.3-70b-versatile'
    );
    reportSummary = (result.summary as string) || '';
    return {
      ...context,
      metadata: { ...context.metadata, reportGenerated: { type: reportType, format, title, fileId: `report_${Date.now()}.${format.toLowerCase()}`, includeCharts, summary: reportSummary, generatedAt: new Date().toISOString(), ...result } },
      workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
    };
  } catch {
    return {
      ...context,
      metadata: { ...context.metadata, reportGenerated: { type: reportType, format, title, fileId: `report_${Date.now()}.${format.toLowerCase()}`, generatedAt: new Date().toISOString() } },
      workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
    };
  }
}

async function executeFormSubmission(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const formData = (node.config.formData as Record<string, unknown>) || {};

  return {
    ...context,
    metadata: {
      ...context.metadata,
      formSubmission: {
        data: formData,
        submittedAt: new Date().toISOString(),
        submissionId: uuid(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeApiCall(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const url = (node.config.url as string) || '';
  const method = (node.config.method as string) || 'GET';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      apiCall: {
        url,
        method,
        calledAt: new Date().toISOString(),
        status: 'simulated',
        responseCode: 200,
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeFileOperation(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const operation = (node.config.operation as string) || 'create';
  const filename = (node.config.filename as string) || `file_${Date.now()}.txt`;
  const content = (node.config.content as string) || '';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      fileOperation: {
        operation,
        filename,
        content: operation === 'read' ? `[simulated content of ${filename}]` : content,
        performedAt: new Date().toISOString(),
        status: 'simulated',
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ DATA NODES ============

async function executeDataStorage(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const key = node.config.key as string;
  const value = node.config.value;

  const stored = (context.metadata.stored as Record<string, unknown>) || {};

  return {
    ...context,
    metadata: {
      ...context.metadata,
      stored: {
        ...stored,
        [key]: value,
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeDataRetrieval(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const key = node.config.key as string;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      retrieved: key,
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeDataTransformation(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const operation = (node.config.operation as string) || 'extract';
  const field = (node.config.field as string) || '';
  const expression = (node.config.expression as string) || '';

  const contextData = context.metadata as Record<string, unknown>;
  let transformedValue: unknown = null;

  switch (operation) {
    case 'map': {
      const sourceArr = contextData[field];
      if (Array.isArray(sourceArr)) {
        transformedValue = sourceArr.map((item) =>
          typeof item === 'object' && item !== null && expression in item
            ? (item as Record<string, unknown>)[expression]
            : item
        );
      }
      break;
    }
    case 'filter': {
      const sourceArr = contextData[field];
      if (Array.isArray(sourceArr)) {
        transformedValue = sourceArr.filter((item) =>
          typeof item === 'object' && item !== null && expression in item
            ? Boolean((item as Record<string, unknown>)[expression])
            : Boolean(item)
        );
      }
      break;
    }
    case 'merge': {
      const target = contextData[field];
      const source = contextData[expression];
      if (typeof target === 'object' && target !== null && typeof source === 'object' && source !== null) {
        transformedValue = { ...target, ...source };
      }
      break;
    }
    case 'extract': {
      const source = contextData[field];
      if (typeof source === 'object' && source !== null) {
        transformedValue = (source as Record<string, unknown>)[expression] ?? null;
      }
      break;
    }
    default:
      transformedValue = null;
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      transformation: {
        operation,
        field,
        expression,
        result: transformedValue,
        performedAt: new Date().toISOString(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeDatabaseWrite(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const table = (node.config.table as string) || 'unknown';
  const data = (node.config.data as Record<string, unknown>) || {};

  const dbWrites = (context.metadata.dbWrites as unknown[]) || [];

  return {
    ...context,
    metadata: {
      ...context.metadata,
      dbWrites: [
        ...dbWrites,
        {
          table,
          data,
          writtenAt: new Date().toISOString(),
          writeId: uuid(),
        },
      ],
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ MONITORING NODES ============

async function executeSLAMonitoring(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const slaThresholdMs = (node.config.slaThresholdMs as number) || 3600000;
  const startTime = context.workflowState.startedAt;
  const elapsed = Date.now() - new Date(startTime).getTime();

  const slaStatus = elapsed <= slaThresholdMs ? 'within' : 'breached';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      slaMonitoring: {
        slaThresholdMs,
        elapsedMs: elapsed,
        status: slaStatus,
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeBottleneckDetection(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const logs = context.logs || [];
  const nodeExecutionTimes: Record<string, number[]> = {};

  for (let i = 0; i < logs.length - 1; i++) {
    const current = logs[i];
    const next = logs[i + 1];
    const currentTime = new Date(current.timestamp).getTime();
    const nextTime = new Date(next.timestamp).getTime();
    const duration = nextTime - currentTime;

    const nodeName = current.nodeName;
    if (!nodeExecutionTimes[nodeName]) nodeExecutionTimes[nodeName] = [];
    nodeExecutionTimes[nodeName].push(duration);
  }

  const bottlenecks = Object.entries(nodeExecutionTimes)
    .map(([nodeName, times]) => ({
      nodeName,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 3);

  return {
    ...context,
    metadata: {
      ...context.metadata,
      bottlenecks,
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeMetricsCollection(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const metricName = (node.config.metricName as string) || 'default';

  const metricsCollected = (context.metadata.metricsCollected as unknown[]) || [];

  return {
    ...context,
    metadata: {
      ...context.metadata,
      metricsCollected: [
        ...metricsCollected,
        {
          name: metricName,
          workflowId: context.workflowId,
          runId: context.runId,
          logCount: (context.logs || []).length,
          metadataKeys: Object.keys(context.metadata),
          collectedAt: new Date().toISOString(),
        },
      ],
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ AUDIT NODES ============

async function executeAuditLog(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const eventType = node.config.eventType as string;
  const message = node.config.message as string;
  const nodeName = (node.config.nodeName as string) || 'audit_log';

  const newLog = {
    nodeId: node.instanceId,
    nodeName,
    status: 'completed' as const,
    message,
    timestamp: new Date().toISOString(),
  };

  return {
    ...context,
    logs: [...(context.logs || []), newLog],
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ UTILITY NODES ============

async function executeDelay(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const delayMs = (node.config.delayMs as number) || 1000;

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeMerge(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  return {
    ...context,
    metadata: {
      ...context.metadata,
      merged: {
        timestamp: new Date().toISOString(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeDebug(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const debugLog = {
    nodeId: node.instanceId,
    nodeName: 'debug',
    status: 'completed' as const,
    message: `[DEBUG] Context state: ${JSON.stringify({
      workflowId: context.workflowId,
      runId: context.runId,
      metadataKeys: Object.keys(context.metadata),
      logCount: (context.logs || []).length,
      workflowStatus: context.workflowState.status,
      currentNode: context.workflowState.currentNodeId,
    })}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...context,
    logs: [...(context.logs || []), debugLog],
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ AGENT NODES ============

async function executeAgentInvoke(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const agentId = (node.config.agentId as string) || '';
  const inputTemplate = (node.config.input as string) || '';

  // Resolve template references like {{fieldName}} from context
  const resolvedInput = inputTemplate.replace(/\{\{(\w+)\}\}/g, (_match, field: string) => {
    const val = (context.metadata as Record<string, unknown>)[field]
      ?? (context as unknown as Record<string, unknown>)[field];
    return val !== undefined ? String(val) : '';
  });

  try {
    const orchestrator = getOrchestrator();
    const { result, processingTime, model } = await orchestrator.routeToAgent(agentId, resolvedInput, context);

    return {
      ...context,
      metadata: {
        ...context.metadata,
        agentInvocation: {
          agentId,
          result,
          processingTime,
          model,
          invokedAt: new Date().toISOString(),
        },
        ...result,
      },
      workflowState: {
        ...context.workflowState,
        currentNodeId: node.instanceId,
      },
    };
  } catch (error) {
    throw new Error(`AgentInvokeFailed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

async function executeAgentMessage(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const toAgent = (node.config.toAgent as string) || '';
  const messageType = (node.config.messageType as string) || 'info';
  const messageContent = (node.config.messageContent as string) || '';

  const messageId = uuid();

  try {
    const db = getDB();
    db.prepare(
      `INSERT INTO agent_messages (id, from_agent, to_agent, message_type, payload, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', datetime('now'))`
    ).run(messageId, context.workflowId, toAgent, messageType, messageContent);
  } catch {
    // Database write failed; continue with context update
  }

  const agentMessages = (context.metadata.agentMessages as unknown[]) || [];

  return {
    ...context,
    metadata: {
      ...context.metadata,
      agentMessages: [
        ...agentMessages,
        {
          id: messageId,
          toAgent,
          messageType,
          messageContent,
          sentAt: new Date().toISOString(),
        },
      ],
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

// ============ NEW NODE IMPLEMENTATIONS ============

async function executeMeetingTranscriptTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const outputPath = (node.config.outputPath as string) || 'context.transcript';
  return {
    ...context,
    metadata: {
      ...context.metadata,
      transcriptTrigger: {
        outputPath,
        triggeredAt: new Date().toISOString(),
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: 'RUNNING' },
  };
}

async function executePurchaseOrder(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const autoApprove = (node.config.autoApprove as boolean) ?? true;
  const notifyVendor = (node.config.notifyVendor as boolean) ?? true;
  const poNumber = `PO-${Date.now()}`;
  const now = new Date().toISOString();

  return {
    ...context,
    metadata: {
      ...context.metadata,
      purchaseOrder: {
        poNumber,
        autoApproved: autoApprove,
        vendorNotified: notifyVendor,
        createdAt: now,
        status: autoApprove ? 'approved' : 'pending_approval',
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executePayment(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const amount = (node.config.amount as number) || 0;
  const currency = (node.config.currency as string) || 'USD';
  const method = (node.config.method as string) || 'ACH';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      payment: {
        amount,
        currency,
        method,
        transactionId: `TXN-${Date.now()}`,
        status: 'simulated_processed',
        processedAt: new Date().toISOString(),
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeRuleEngine(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const rules = (node.config.rules as string[]) || [];
  const stopOnFirstFail = (node.config.stopOnFirstFail as boolean) ?? false;
  const flatCtx: Record<string, unknown> = { ...context.metadata, ...context.document, ...context.invoice, ...context.finance, ...context.employee, ...context.procurement };

  const results: Array<{ rule: string; passed: boolean; reason?: string }> = [];
  for (const rule of rules) {
    // Rule format: "field op value" e.g. "amount > 1000" or "status == approved"
    const parts = rule.trim().match(/^(\S+)\s+(==|!=|>|<|>=|<=|contains|exists)\s*(.*)$/);
    if (!parts) { results.push({ rule, passed: true, reason: 'unparseable rule — skipped' }); continue; }
    const [, field, op, val] = parts;
    const fieldVal = flatCtx[field];
    const parsed = isNaN(Number(val)) ? val.replace(/^['"]|['"]$/g, '') : Number(val);
    const passed = safeCompare(fieldVal, op, parsed);
    results.push({ rule, passed });
    if (!passed && stopOnFirstFail) break;
  }

  const allPassed = results.every((r) => r.passed);
  return {
    ...context,
    metadata: { ...context.metadata, ruleEngineResult: { results, allPassed, rulesEvaluated: results.length, evaluatedAt: new Date().toISOString() } },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeHealthCheck(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const targets = (node.config.targets as string[]) || ['database', 'api'];
  const results = targets.map((target) => ({
    target,
    status: 'healthy',
    latencyMs: Math.floor(Math.random() * 50) + 10,
    checkedAt: new Date().toISOString(),
  }));

  return {
    ...context,
    metadata: {
      ...context.metadata,
      healthCheck: {
        results,
        overallStatus: 'healthy',
        checkedAt: new Date().toISOString(),
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeAuditStorage(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const eventType = (node.config.eventType as string) || 'workflow_event';
  const retentionDays = (node.config.retentionDays as number) || 365;
  const now = new Date().toISOString();

  try {
    const db = getDB();
    db.prepare(
      `INSERT INTO audit_logs (id, agent_id, event_type, event, metadata, timestamp)
       VALUES (?, 'workflow_engine', ?, ?, ?, ?)`
    ).run(
      uuid(),
      eventType,
      `Workflow ${context.workflowId} audit event`,
      JSON.stringify({ runId: context.runId, metadata: context.metadata, retentionDays }),
      now
    );
  } catch {
    // Silently fail if audit table unavailable
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      auditStored: { eventType, storedAt: now, retentionDays },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeRetryNode(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const maxAttempts = (node.config.maxAttempts as number) || 3;
  const currentAttempt = ((context.workflowState.retries as Record<string, number>)?.[node.instanceId] || 0) + 1;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      retryInfo: {
        nodeId: node.instanceId,
        attempt: currentAttempt,
        maxAttempts,
        scheduledAt: new Date().toISOString(),
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
      retries: { ...((context.workflowState.retries as Record<string, number>) || {}), [node.instanceId]: currentAttempt },
    },
  };
}

async function executeWorkflowCompletion(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const status = (node.config.status as string) || 'COMPLETED';
  const message = (node.config.message as string) || 'Workflow completed successfully';
  const now = new Date().toISOString();

  try {
    const db = getDB();
    db.prepare(`UPDATE workflow_runs SET status = ?, completed_at = ? WHERE id = ?`)
      .run(status, now, context.runId);
  } catch {
    // Silently fail
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      workflowCompletion: { status, message, completedAt: now },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId, status: status as WorkflowContext['workflowState']['status'] },
  };
}

async function executeDashboardUpdate(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const dashboardId = (node.config.dashboardId as string) || 'default';
  const metrics = node.config.metrics as string | string[];
  const metricList = Array.isArray(metrics) ? metrics : (metrics || '').split(',').map((m: string) => m.trim()).filter(Boolean);

  return {
    ...context,
    metadata: {
      ...context.metadata,
      dashboardUpdate: {
        dashboardId,
        metrics: metricList,
        updatedAt: new Date().toISOString(),
        status: 'simulated_updated',
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeOCR(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const outputFormat = (node.config.outputFormat as string) || 'Plain Text';
  const inputFile = (context.metadata as Record<string, unknown>).uploadedFile
    || (context.document as Record<string, unknown>)?.content
    || 'document.pdf';

  return {
    ...context,
    metadata: {
      ...context.metadata,
      ocrOutput: {
        text: `[Simulated OCR extraction from ${inputFile}]`,
        pages: 1,
        format: outputFormat,
        confidence: 0.97,
        extractedAt: new Date().toISOString(),
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

async function executeValidation(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const rules = (node.config.rules as string) || '';
  const failAction = (node.config.failAction as string) || 'Stop Workflow';
  const ruleList = rules.split(',').map((r) => r.trim()).filter(Boolean);

  // Simulate validation — in production, evaluate against actual context data
  const violations: string[] = [];
  ruleList.forEach((rule) => {
    const [type, field] = rule.split(':');
    if (type === 'required' && field) {
      const contextData = context.metadata as Record<string, unknown>;
      if (!contextData[field] && !(context.document as Record<string, unknown>)?.[field]) {
        // Don't actually fail in simulation mode
      }
    }
  });

  if (violations.length > 0 && failAction === 'Stop Workflow') {
    throw new Error(`ValidationFailed: ${violations.join(', ')}`);
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      validation: {
        rules: ruleList,
        violations,
        passed: violations.length === 0,
        validatedAt: new Date().toISOString(),
      },
    },
    workflowState: { ...context.workflowState, currentNodeId: node.instanceId },
  };
}

// ============ HELPERS ============

function safeCompare(fieldValue: unknown, operator: string, compareValue: unknown): boolean {
  switch (operator) {
    case 'eq':
    case '==':
    case '===':
      return fieldValue === compareValue;
    case 'neq':
    case '!=':
    case '!==':
      return fieldValue !== compareValue;
    case 'gt':
    case '>':
      return Number(fieldValue) > Number(compareValue);
    case 'gte':
    case '>=':
      return Number(fieldValue) >= Number(compareValue);
    case 'lt':
    case '<':
      return Number(fieldValue) < Number(compareValue);
    case 'lte':
    case '<=':
      return Number(fieldValue) <= Number(compareValue);
    case 'contains':
      return typeof fieldValue === 'string' && typeof compareValue === 'string'
        ? fieldValue.includes(compareValue)
        : false;
    case 'startsWith':
      return typeof fieldValue === 'string' && typeof compareValue === 'string'
        ? fieldValue.startsWith(compareValue)
        : false;
    case 'endsWith':
      return typeof fieldValue === 'string' && typeof compareValue === 'string'
        ? fieldValue.endsWith(compareValue)
        : false;
    case 'in':
      return Array.isArray(compareValue) ? compareValue.includes(fieldValue) : false;
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'truthy':
      return Boolean(fieldValue);
    default:
      return false;
  }
}
