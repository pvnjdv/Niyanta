import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { getDB } from '../db/database';

const router = Router();

const emptyDecisionBreakdown = {
  autoApprove: 0,
  flag: 0,
  reject: 0,
  proceed: 0,
  hold: 0,
  escalate: 0,
  other: 0,
};

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getP95(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return sorted[index];
}

function formatDurationLabel(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) {
    return 'No SLA';
  }
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }
  return `${Math.round(minutes)}m`;
}

router.get('/', (_req: Request, res: Response) => {
  const orchestrator = getOrchestrator();
  const db = getDB();
  const orchestratorMetrics = orchestrator.getMetrics();

  const runs = db
    .prepare(
      `SELECT wr.*, w.name AS workflow_name, w.category AS workflow_category
       FROM workflow_runs wr
       LEFT JOIN workflows w ON w.id = wr.workflow_id
       ORDER BY wr.started_at DESC`
    )
    .all() as Array<Record<string, unknown>>;
  const workflowLogs = db
    .prepare(
      `SELECT run_id, node_id, node_type, status, duration_ms, error, timestamp
       FROM workflow_logs
       ORDER BY timestamp DESC
       LIMIT 1000`
    )
    .all() as Array<Record<string, unknown>>;
  const approvals = db
    .prepare('SELECT * FROM pending_approvals ORDER BY created_at DESC LIMIT 200')
    .all() as Array<Record<string, unknown>>;
  const decisions = db
    .prepare("SELECT decision FROM audit_logs WHERE decision IS NOT NULL AND TRIM(decision) != ''")
    .all() as Array<{ decision: string }>;
  const activeAgents = (db.prepare("SELECT COUNT(*) as count FROM agents WHERE status = 'active'").get() as { count: number }).count;
  const workflowCount = (db.prepare('SELECT COUNT(*) as count FROM workflows').get() as { count: number }).count;

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const workflowStatusBreakdown = {
    PENDING: 0,
    RUNNING: 0,
    WAITING_APPROVAL: 0,
    FAILED: 0,
    COMPLETED: 0,
  };
  const decisionBreakdown = { ...emptyDecisionBreakdown };

  decisions.forEach((entry) => {
    const decision = String(entry.decision || '').toUpperCase();
    if (decision.includes('AUTO-APPROVE')) decisionBreakdown.autoApprove += 1;
    else if (decision.includes('FLAG')) decisionBreakdown.flag += 1;
    else if (decision.includes('REJECT')) decisionBreakdown.reject += 1;
    else if (decision.includes('PROCEED')) decisionBreakdown.proceed += 1;
    else if (decision.includes('HOLD')) decisionBreakdown.hold += 1;
    else if (decision.includes('ESCALATE')) decisionBreakdown.escalate += 1;
    else decisionBreakdown.other += 1;
  });

  let totalDurationMs = 0;
  let completedDurationCount = 0;
  let totalTasksCreated = 0;

  const recentRuns = runs.slice(0, 12).map((run) => {
    const context = safeParseJson<Record<string, unknown>>(run.context, {});
    const workflowState = (context.workflowState || {}) as Record<string, unknown>;
    const executedNodeIds = Array.isArray(workflowState.executedNodeIds) ? (workflowState.executedNodeIds as unknown[]) : [];
    const pendingNodeIds = Array.isArray(workflowState.pendingNodeIds) ? (workflowState.pendingNodeIds as unknown[]) : [];
    const totalKnownNodes = executedNodeIds.length + pendingNodeIds.length;
    const startedAt = new Date(String(run.started_at || new Date().toISOString())).getTime();
    const completedAtRaw = run.completed_at ? new Date(String(run.completed_at)).getTime() : null;
    const elapsedMs = Math.max(0, (completedAtRaw || now) - startedAt);
    const approval = approvals.find((item) => String(item.workflow_run_id) === String(run.id) && String(item.status) === 'PENDING');
    const approvalDeadline = approval?.deadline ? new Date(String(approval.deadline)).getTime() : null;
    const targetMinutes = approvalDeadline && Number.isFinite(approvalDeadline)
      ? Math.max(1, Math.round((approvalDeadline - startedAt) / 60000))
      : null;

    const task = (context.task || {}) as Record<string, unknown>;
    if (task.title) {
      totalTasksCreated += 1;
    }

    const status = String(run.status || 'PENDING') as keyof typeof workflowStatusBreakdown;
    if (workflowStatusBreakdown[status] !== undefined) {
      workflowStatusBreakdown[status] += 1;
    }

    if (run.completed_at) {
      totalDurationMs += elapsedMs;
      completedDurationCount += 1;
    }

    return {
      id: run.id,
      workflowId: run.workflow_id,
      workflowName: run.workflow_name || run.workflow_id,
      category: run.workflow_category || 'General',
      status: run.status,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      currentNodeId: workflowState.currentNodeId || null,
      progress: totalKnownNodes > 0 ? Math.round((executedNodeIds.length / totalKnownNodes) * 100) : run.status === 'COMPLETED' ? 100 : 0,
      elapsedMs,
      errorMessage: run.error_message || workflowState.lastError || null,
      approvalDeadline: approval?.deadline || null,
      approvalPriority: approval?.priority || null,
      slaConsumedPct: targetMinutes ? Math.round((elapsedMs / (targetMinutes * 60000)) * 100) : null,
      slaTarget: formatDurationLabel(targetMinutes),
    };
  });

  const bottlenecks = Array.from(
    workflowLogs.reduce((groups, log) => {
      const key = `${String(log.node_type || 'unknown')}::${String(log.node_id || 'unknown')}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(log);
      return groups;
    }, new Map<string, Array<Record<string, unknown>>>())
  )
    .map(([key, entries]) => {
      const [nodeType, nodeId] = key.split('::');
      const durations = entries.map((entry) => Number(entry.duration_ms || 0)).filter((value) => value > 0);
      const failures = entries.filter((entry) => String(entry.status) === 'failed').length;
      const avgMs = durations.length > 0 ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
      return {
        nodeId,
        nodeType,
        avgMs,
        p95Ms: getP95(durations),
        failureCount: failures,
        totalExecutions: entries.length,
        severity: failures > 0 || avgMs > 12000 ? 'critical' : avgMs > 6000 ? 'warning' : 'normal',
      };
    })
    .sort((left, right) => right.avgMs - left.avgMs)
    .slice(0, 8);

  const failedToday = runs.filter((run) => {
    const startedAt = new Date(String(run.started_at || 0)).getTime();
    return String(run.status) === 'FAILED' && startedAt >= startOfDay.getTime();
  }).length;

  const alerts = [
    ...approvals
      .filter((approval) => String(approval.status) === 'PENDING' && String(approval.priority) === 'critical')
      .slice(0, 4)
      .map((approval) => ({
        level: 'critical',
        title: `Critical approval waiting: ${approval.title || approval.workflow_name}`,
        detail: `Assigned to ${approval.assigned_to || 'admin'} for workflow ${approval.workflow_name}.`,
        timestamp: approval.created_at,
        source: 'approval',
      })),
    ...recentRuns
      .filter((run) => String(run.status) === 'FAILED')
      .slice(0, 4)
      .map((run) => ({
        level: 'warning',
        title: `Workflow failed: ${run.workflowName}`,
        detail: String(run.errorMessage || 'Workflow execution failed.'),
        timestamp: run.startedAt,
        source: 'workflow',
      })),
    ...recentRuns
      .filter((run) => String(run.status) === 'WAITING_APPROVAL')
      .slice(0, 4)
      .map((run) => ({
        level: 'info',
        title: `Workflow paused for approval: ${run.workflowName}`,
        detail: `Awaiting human decision${run.approvalPriority ? ` (${run.approvalPriority})` : ''}.`,
        timestamp: run.startedAt,
        source: 'workflow',
      })),
  ].slice(0, 10);

  const pendingApprovals = approvals.filter((approval) => String(approval.status) === 'PENDING').length;
  const criticalAlerts = alerts.filter((alert) => alert.level === 'critical').length;
  const avgProcessingTimeMs = completedDurationCount > 0
    ? Math.round(totalDurationMs / completedDurationCount)
    : orchestratorMetrics.avgProcessingTimeMs;

  res.json({
    ...orchestratorMetrics,
    totalRuns: runs.length,
    totalWorkflowsRun: runs.length,
    totalTasksCreated,
    totalDecisionsMade: decisions.length,
    avgProcessingTimeMs,
    activeAgents,
    workflows: workflowCount,
    pendingApprovals,
    failedToday,
    criticalAlerts,
    workflowStatusBreakdown,
    decisionBreakdown,
    recentRuns,
    bottlenecks,
    alerts,
    slaTrackers: recentRuns
      .filter((run) => String(run.status) === 'RUNNING' || String(run.status) === 'WAITING_APPROVAL')
      .map((run) => ({
        name: run.workflowName,
        consumed: run.slaConsumedPct,
        target: run.slaTarget,
        status: run.status,
      })),
    lastUpdated: new Date().toISOString(),
  });
});

export default router;
