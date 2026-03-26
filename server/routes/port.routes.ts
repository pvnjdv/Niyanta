import { Router, Request, Response } from 'express';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import { getDB } from '../db/database';

const router = Router();

// POST /access/:accessKey - Route input to an agent via its access port
router.post('/access/:accessKey', async (req: Request, res: Response) => {
  const { accessKey } = req.params;
  const { input } = req.body;

  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'input is required and must be a non-empty string',
    });
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
    return res.status(status).json({
      success: false,
      error: 'PortAccessFailed',
      message,
    });
  }
});

// GET /info/:accessKey - Get port info (agent name, capabilities) without exposing the key
router.get('/info/:accessKey', (req: Request, res: Response) => {
  const { accessKey } = req.params;

  try {
    const db = getDB();
    const port = db
      .prepare(
        `SELECT id, agent_id, port_name, is_active, allowed_operations, rate_limit, total_requests, created_at, last_accessed
         FROM agent_ports
         WHERE access_key = ?`
      )
      .get(accessKey) as Record<string, unknown> | undefined;

    if (!port) {
      return res.status(404).json({
        success: false,
        error: 'NotFound',
        message: 'No port found for the given access key',
      });
    }

    const agentId = port.agent_id as string;
    const orchestrator = getOrchestrator();
    const agent = orchestrator.getAgentManager().getAgent(agentId);

    return res.json({
      success: true,
      port: {
        id: port.id,
        portName: port.port_name,
        agentId,
        agentName: agent?.name || agentId,
        capabilities: agent?.capabilities || [],
        description: agent?.description || '',
        isActive: port.is_active === 1,
        allowedOperations:
          typeof port.allowed_operations === 'string'
            ? JSON.parse(port.allowed_operations as string)
            : port.allowed_operations,
        rateLimit: port.rate_limit,
        totalRequests: port.total_requests,
        createdAt: port.created_at,
        lastAccessed: port.last_accessed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: 'PortInfoFailed',
      message,
    });
  }
});

export default router;
