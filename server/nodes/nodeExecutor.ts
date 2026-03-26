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
    // TRIGGER NODES
    case 'manual_trigger':
      return executeManualTrigger(node, context);
    case 'webhook_trigger':
      return executeWebhookTrigger(node, context);
    case 'file_upload_trigger':
      return executeFileUploadTrigger(node, context);
    case 'timer_trigger':
      return executeTimerTrigger(node, context);
    case 'schedule':
      return executeSchedule(node, context);
    case 'api_trigger':
      return executeApiTrigger(node, context);

    // AI NODES
    case 'llm_analysis':
      return executeLLMAnalysis(node, context);
    case 'classification':
      return executeClassification(node, context);
    case 'summarization':
      return executeSummarization(node, context);
    case 'risk_analysis':
      return executeRiskAnalysis(node, context);
    case 'decision_generation':
      return executeDecisionGeneration(node, context);

    // DECISION NODES
    case 'approval':
      return executeApproval(node, context);
    case 'conditional_routing':
      return executeConditionalRouting(node, context);
    case 'threshold_decision':
      return executeThresholdDecision(node, context);
    case 'condition':
      return executeCondition(node, context);
    case 'approval_chain':
      return executeApprovalChain(node, context);

    // ACTION NODES
    case 'invoice_processing':
      return executeInvoiceProcessing(node, context);
    case 'task_assignment':
      return executeTaskAssignment(node, context);
    case 'notification':
      return executeNotification(node, context);
    case 'report_generation':
      return executeReportGeneration(node, context);
    case 'form_submission':
      return executeFormSubmission(node, context);
    case 'api_call':
      return executeApiCall(node, context);
    case 'file_operation':
      return executeFileOperation(node, context);

    // DATA NODES
    case 'data_storage':
      return executeDataStorage(node, context);
    case 'data_retrieval':
      return executeDataRetrieval(node, context);
    case 'data_transformation':
      return executeDataTransformation(node, context);
    case 'database_write':
      return executeDatabaseWrite(node, context);

    // MONITORING NODES
    case 'sla_monitoring':
      return executeSLAMonitoring(node, context);
    case 'bottleneck_detection':
      return executeBottleneckDetection(node, context);
    case 'metrics_collection':
      return executeMetricsCollection(node, context);

    // AUDIT NODES
    case 'audit_log':
      return executeAuditLog(node, context);

    // UTILITY NODES
    case 'delay':
      return executeDelay(node, context);
    case 'merge':
      return executeMerge(node, context);
    case 'debug':
      return executeDebug(node, context);

    // AGENT NODES
    case 'agent_invoke':
      return executeAgentInvoke(node, context);
    case 'agent_message':
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
  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeFileUploadTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeTimerTrigger(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  return {
    ...context,
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
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
  const approver = node.config.approver as string;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      approvalDecision: 'approved',
      approvedBy: approver,
      approvedAt: new Date().toISOString(),
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
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
  return {
    ...context,
    invoice: {
      ...context.invoice,
      processed: true,
      processedAt: new Date().toISOString(),
    },
    task: {
      ...context.task,
      type: 'invoice_processed',
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
}

async function executeTaskAssignment(node: NodeToExecute, context: WorkflowContext): Promise<WorkflowContext> {
  const assignee = node.config.assignee as string;
  const priority = node.config.priority || 'medium';

  return {
    ...context,
    task: {
      ...context.task,
      assignedTo: assignee,
      priority,
      assignedAt: new Date().toISOString(),
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
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
  const reportType = node.config.reportType as string;

  return {
    ...context,
    metadata: {
      ...context.metadata,
      reportGenerated: {
        type: reportType,
        generatedAt: new Date().toISOString(),
        fileId: `report_${Date.now()}.pdf`,
      },
    },
    workflowState: {
      ...context.workflowState,
      currentNodeId: node.instanceId,
    },
  };
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
