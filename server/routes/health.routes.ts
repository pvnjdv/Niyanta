import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const metrics = getOrchestrator().getMetrics();
  res.json({
    status: 'ok',
    uptimeSeconds: metrics.uptimeSeconds,
    agentsActive: metrics.agentsActive,
    totalRuns: metrics.totalWorkflowsRun,
    timestamp: new Date().toISOString(),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
});

export default router;
