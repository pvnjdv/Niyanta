import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { RunAgentRequest } from '../types/api.types';
import { validateAgentRun } from '../middleware/validator';

const router = Router();

// ── Run an agent ─────────────────────────────────────────────────────
router.post('/run', validateAgentRun, async (req: Request, res: Response) => {
  const { agentId, input, workflowContext }: RunAgentRequest = req.body;

  // Dynamic validation: look up valid agents from the AgentManager
  const orchestrator = getOrchestrator();
  const validAgents = orchestrator.getAgentManager().getAllAgents().map((a) => a.agent_id);

  if (!validAgents.includes(agentId)) {
    return res.status(400).json({ error: 'InvalidAgent', message: `Unsupported agent: ${agentId}` });
  }

  const sessionId = uuid();

  try {
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

// ── List all agents ──────────────────────────────────────────────────
router.get('/list', (_req: Request, res: Response) => {
  const orchestrator = getOrchestrator();
  const agents = orchestrator.getAgentManager().getAllAgents();
  res.json({ agents });
});

// ── Inter-agent messaging ────────────────────────────────────────────

router.post('/message', (req: Request, res: Response) => {
  const { from, to, type, payload } = req.body;

  if (!from || !to || !type) {
    return res.status(400).json({ error: 'ValidationError', message: 'from, to, and type are required' });
  }

  try {
    const orchestrator = getOrchestrator();
    const result = orchestrator.sendAgentMessage(from, to, type, payload || {});
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'MessageSendFailed', message });
  }
});

router.get('/:agentId/messages', (req: Request, res: Response) => {
  const { agentId } = req.params;

  try {
    const orchestrator = getOrchestrator();
    const messages = orchestrator.getAgentMessages(agentId);
    return res.json({ success: true, agentId, messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'FetchMessagesFailed', message });
  }
});

// ── Agent access ports ───────────────────────────────────────────────

router.post('/port/create', (req: Request, res: Response) => {
  const { agentId, portName } = req.body;

  if (!agentId || !portName) {
    return res.status(400).json({ error: 'ValidationError', message: 'agentId and portName are required' });
  }

  try {
    const orchestrator = getOrchestrator();
    const port = orchestrator.createAgentPort(agentId, portName);
    return res.status(201).json({ success: true, ...port });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'PortCreationFailed', message });
  }
});

router.get('/ports', (_req: Request, res: Response) => {
  try {
    const orchestrator = getOrchestrator();
    const ports = orchestrator.getAgentPorts();
    return res.json({ success: true, ports });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'FetchPortsFailed', message });
  }
});

router.get('/ports/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;

  try {
    const orchestrator = getOrchestrator();
    const ports = orchestrator.getAgentPorts(agentId);
    return res.json({ success: true, agentId, ports });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'FetchPortsFailed', message });
  }
});

router.post('/port/access/:accessKey', async (req: Request, res: Response) => {
  const { accessKey } = req.params;
  const { input } = req.body;

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({ error: 'ValidationError', message: 'input is required and must be a non-empty string' });
  }

  try {
    const orchestrator = getOrchestrator();
    const { result, processingTime, model, agentId } = await orchestrator.routeViaPort(accessKey, input);
    return res.status(200).json({
      success: true,
      agentId,
      result,
      processingTime,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'Invalid access key' || message === 'Port is disabled' ? 403 : 500;
    return res.status(status).json({ success: false, error: 'PortAccessFailed', message });
  }
});

export default router;
