import { Router, Request, Response } from 'express';
import multer from 'multer';
import { getOrchestrator } from '../core/NiyantaOrchestrator';
import {
  NiyantaActivityItem,
  NiyantaChatRequest,
  NiyantaChatResponse,
  NiyantaReportCard,
  NiyantaSystemContext,
} from '../types/api.types';
import { extractUploadedFile } from '../utils/fileExtraction';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 4, fileSize: 12 * 1024 * 1024 },
});

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildChatActivity(
  message: string,
  agentResults: Record<string, unknown>,
  systemContext?: NiyantaSystemContext
): NiyantaActivityItem[] {
  const agents = asArray(systemContext?.agents);
  const workflows = asArray(systemContext?.workflows);
  const auditTrail = asArray(systemContext?.auditTrail);
  const reports = asArray(systemContext?.reports);
  const capabilityCount = agents.reduce((sum, agent) => {
    const capabilities = Array.isArray(agent.capabilities) ? agent.capabilities : [];
    return sum + capabilities.length;
  }, 0);
  const resultCount = Object.keys(agentResults || {}).length;
  const startedAt = Date.now();

  return [
    {
      id: 'input',
      label: 'Input accepted',
      detail: `Queued operator request and synced ${resultCount} live agent report${resultCount === 1 ? '' : 's'}.`,
      tone: 'info',
      timestamp: new Date(startedAt).toISOString(),
    },
    {
      id: 'capabilities',
      label: 'Capability map loaded',
      detail: `Mapped ${agents.length} agents and ${capabilityCount} declared capabilities into Niyanta control scope.`,
      tone: 'success',
      timestamp: new Date(startedAt + 150).toISOString(),
    },
    {
      id: 'reports',
      label: 'Reports synchronized',
      detail: `Reviewed ${workflows.length} workflow${workflows.length === 1 ? '' : 's'}, ${auditTrail.length} audit event${auditTrail.length === 1 ? '' : 's'}, and ${reports.length} agent report${reports.length === 1 ? '' : 's'}.`,
      tone: 'info',
      timestamp: new Date(startedAt + 300).toISOString(),
    },
    {
      id: 'response',
      label: 'Control response composed',
      detail: `Niyanta generated a controlled answer for: ${message.slice(0, 96)}${message.length > 96 ? '…' : ''}`,
      tone: 'success',
      timestamp: new Date(startedAt + 450).toISOString(),
    },
  ];
}

function buildReportCards(
  agentResults: Record<string, unknown>,
  systemContext?: NiyantaSystemContext
): NiyantaReportCard[] {
  const agents = asArray(systemContext?.agents);
  const workflows = asArray(systemContext?.workflows);
  const auditTrail = asArray(systemContext?.auditTrail);
  const metrics = systemContext && typeof systemContext.metrics === 'object' && systemContext.metrics
    ? systemContext.metrics as Record<string, unknown>
    : {};

  const activeAgents = toNumber(metrics.agentsActive, agents.length);
  const workflowRuns = toNumber(metrics.totalWorkflowsRun, 0);
  const decisions = toNumber(metrics.totalDecisionsMade, 0);
  const escalations = toNumber(metrics.escalationsTriggered, 0);
  const liveResults = Object.keys(agentResults || {}).length;

  return [
    {
      id: 'agents',
      title: 'Active Agents',
      value: String(activeAgents),
      detail: `${liveResults} live result${liveResults === 1 ? '' : 's'} available in memory.`,
      tone: activeAgents > 0 ? 'success' : 'warning',
    },
    {
      id: 'workflows',
      title: 'Workflow Studio',
      value: String(workflows.length),
      detail: `${workflowRuns} total workflow run${workflowRuns === 1 ? '' : 's'} recorded.`,
      tone: workflows.length > 0 ? 'info' : 'warning',
    },
    {
      id: 'audit',
      title: 'Audit Events',
      value: String(auditTrail.length),
      detail: `${decisions} decisions logged across the control plane.`,
      tone: auditTrail.length > 0 ? 'info' : 'warning',
    },
    {
      id: 'risk',
      title: 'Escalations',
      value: String(escalations),
      detail: escalations > 0 ? 'Human review remains active for high-risk flows.' : 'No escalation pressure in the latest snapshot.',
      tone: escalations > 0 ? 'warning' : 'success',
    },
  ];
}

router.post('/extract', upload.array('files', 4), async (req: Request, res: Response) => {
  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length === 0) {
    return res.status(400).json({ error: 'ValidationError', message: 'At least one file must be uploaded' });
  }

  try {
    const extracted = await Promise.all(files.map((file) => extractUploadedFile(file)));
    return res.status(200).json({ files: extracted, timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: 'FileExtractionFailed', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory, agentResults, systemContext }: NiyantaChatRequest = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'ValidationError', message: 'message must be a non-empty string' });
  }

  try {
    const orchestrator = getOrchestrator();
    const reply = await orchestrator.processOrchestratorChat(
      message,
      Array.isArray(conversationHistory) ? conversationHistory : [],
      agentResults || {},
      systemContext || {}
    );
    const response: NiyantaChatResponse = {
      reply,
      timestamp: new Date().toISOString(),
      activity: buildChatActivity(message, agentResults || {}, systemContext),
      reports: buildReportCards(agentResults || {}, systemContext),
    };
    return res.status(200).json(response);
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
