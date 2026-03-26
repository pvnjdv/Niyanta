import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const orchestrator = getOrchestrator();
  res.json(orchestrator.getMetrics());
});

export default router;
