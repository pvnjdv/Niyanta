import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { RunAgentRequest } from '../types/api.types';
import { validateAgentRun } from '../middleware/validator';

const router = Router();
const VALID_AGENTS = ['meeting', 'invoice', 'hr', 'procurement', 'security', 'compliance', 'document', 'monitoring', 'workflow', 'it_ops'];

router.post('/run', validateAgentRun, async (req: Request, res: Response) => {
  const { agentId, input, workflowContext }: RunAgentRequest = req.body;

  if (!VALID_AGENTS.includes(agentId)) {
    return res.status(400).json({ error: 'InvalidAgent', message: `Unsupported agent: ${agentId}` });
  }

  const sessionId = uuid();

  try {
    const orchestrator = getOrchestrator();
    const { result, processingTime, model } = await orchestrator.routeToAgent(agentId, input, workflowContext);
    return res.status(200).json({
      success: true,
      sessionId,
      agentId,
      result,
      processingTime,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      sessionId,
      agentId,
      error: 'AgentExecutionFailed',
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/list', (_req: Request, res: Response) => {
  const orchestrator = getOrchestrator();
  const agents = orchestrator.getAgentManager().getAllAgents();
  res.json({ agents });
});

export default router;
