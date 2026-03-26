import { Router, Request, Response } from 'express';
import { AuditLogger } from '../core/AuditLogger';

const router = Router();
const auditLogger = new AuditLogger();

router.get('/', (_req: Request, res: Response) => {
  const entries = auditLogger.getRecent(100);
  res.json({ entries, total: entries.length });
});

router.get('/decisions', (_req: Request, res: Response) => {
  const entries = auditLogger.getDecisions(50);
  res.json({ entries });
});

router.get('/agent/:agentId', (req: Request, res: Response) => {
  const entries = auditLogger.getByAgent(req.params.agentId, 50);
  res.json({ entries });
});

export default router;
