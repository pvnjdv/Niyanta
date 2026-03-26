import { WorkflowContext } from '../types/workflow.types';
import { callGroqJSON } from '../utils/groqClient';

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

    // AI NODES
    case 'llm_analysis':
      return executeLLMAnalysis(node, context);
    case 'classification':
      return executeClassification(node, context);
    case 'summarization':
      return executeSummarization(node, context);

    // DECISION NODES
    case 'approval':
      return executeApproval(node, context);
    case 'conditional_routing':
      return executeConditionalRouting(node, context);
    case 'threshold_decision':
      return executeThresholdDecision(node, context);

    // ACTION NODES
    case 'invoice_processing':
      return executeInvoiceProcessing(node, context);
    case 'task_assignment':
      return executeTaskAssignment(node, context);
    case 'notification':
      return executeNotification(node, context);
    case 'report_generation':
      return executeReportGeneration(node, context);

    // DATA NODES
    case 'data_storage':
      return executeDataStorage(node, context);
    case 'data_retrieval':
      return executeDataRetrieval(node, context);

    // MONITORING NODES
    case 'sla_monitoring':
      return executeSLAMonitoring(node, context);
    case 'bottleneck_detection':
      return executeBottleneckDetection(node, context);

    // AUDIT NODES
    case 'audit_log':
      return executeAuditLog(node, context);

    // UTILITY NODES
    case 'delay':
      return executeDelay(node, context);
    case 'merge':
      return executeMerge(node, context);

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
  const condition = node.config.condition as string;
  const trueValue = node.config.trueValue;
  const falseValue = node.config.falseValue;

  let conditionMet = false;
  try {
    // eslint-disable-next-line no-eval
    conditionMet = eval(condition);
  } catch {
    conditionMet = false;
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
      routingDecision: conditionMet ? trueValue : falseValue,
      condition,
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
