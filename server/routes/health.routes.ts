import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { getDB } from '../db/database';
import fs from 'fs';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const metrics = getOrchestrator().getMetrics();
  const db = getDB();
  const storagePath = process.env.STORAGE_PATH || './storage';
  const workflowCounts = db.prepare("SELECT status, COUNT(*) as count FROM workflow_runs GROUP BY status").all() as Array<{ status: string; count: number }>;
  const pendingApprovals = (db.prepare("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'PENDING'").get() as { count: number }).count;
  const services = [
    {
      name: 'Niyanta Orchestrator',
      status: 'UP',
      detail: `${metrics.agentsActive} active agents under orchestration`,
    },
    {
      name: 'Workflow Engine',
      status: 'UP',
      detail: `${workflowCounts.reduce((sum, row) => sum + row.count, 0)} total workflow runs tracked`,
    },
    {
      name: 'SQLite Database',
      status: 'UP',
      detail: db.prepare('SELECT 1 as ok').get() ? 'Connected to local database' : 'Database unavailable',
    },
    {
      name: 'Local Storage',
      status: fs.existsSync(storagePath) ? 'UP' : 'DOWN',
      detail: fs.existsSync(storagePath) ? `Writable path ${storagePath}` : `Missing storage path ${storagePath}`,
    },
    {
      name: 'Groq Model Runtime',
      status: process.env.GROQ_API_KEY ? 'UP' : 'DEGRADED',
      detail: process.env.GROQ_API_KEY ? `Model ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'} configured` : 'GROQ_API_KEY is not configured',
    },
    {
      name: 'Approval Queue',
      status: pendingApprovals > 0 ? 'DEGRADED' : 'UP',
      detail: `${pendingApprovals} pending approval${pendingApprovals === 1 ? '' : 's'}`,
    },
  ];

  res.json({
    status: 'ok',
    uptimeSeconds: metrics.uptimeSeconds,
    agentsActive: metrics.agentsActive,
    totalRuns: metrics.totalWorkflowsRun,
    timestamp: new Date().toISOString(),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    services,
    workflowStatusBreakdown: workflowCounts.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {} as Record<string, number>),
    pendingApprovals,
  });
});

export default router;
