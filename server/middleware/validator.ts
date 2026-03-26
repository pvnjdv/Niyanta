import { Request, Response, NextFunction } from 'express';

export function validateAgentRun(req: Request, res: Response, next: NextFunction): void {
  const { agentId, input } = req.body;

  if (!agentId || typeof agentId !== 'string') {
    res.status(400).json({ error: 'ValidationError', message: 'agentId is required and must be a string' });
    return;
  }

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    res.status(400).json({ error: 'ValidationError', message: 'input is required and must be a non-empty string' });
    return;
  }

  if (input.length > 15000) {
    res.status(413).json({ error: 'ValidationError', message: 'input exceeds 15000 characters' });
    return;
  }

  next();
}
