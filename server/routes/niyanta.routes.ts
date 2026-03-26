import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { NiyantaChatRequest } from '../types/api.types';

const router = Router();

router.post('/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory, agentResults }: NiyantaChatRequest = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'ValidationError', message: 'message must be a non-empty string' });
  }

  try {
    const orchestrator = getOrchestrator();
    const reply = await orchestrator.processOrchestratorChat(
      message,
      Array.isArray(conversationHistory) ? conversationHistory : [],
      agentResults || {}
    );
    return res.status(200).json({ reply, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: 'ChatFailed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/insights', async (req: Request, res: Response) => {
  const { agentResults } = req.body;

  try {
    const orchestrator = getOrchestrator();
    const insights = await orchestrator.detectCrossWorkflowInsights(agentResults || {});
    return res.status(200).json({ insights, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: 'InsightsFailed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
