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

// ── Create a new agent ───────────────────────────────────────────────
router.post('/', (req: Request, res: Response) => {
  const { name, description, icon, capabilities, systemPrompt, subtitle } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'ValidationError', message: 'name is required' });
  }
  if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
    return res.status(400).json({ error: 'ValidationError', message: 'systemPrompt is required' });
  }

  try {
    const orchestrator = getOrchestrator();
    const agentManager = orchestrator.getAgentManager();
    const agentDef = agentManager.createAgent({
      name: name.trim(),
      description: description || '',
      icon: icon || name.slice(0, 2).toUpperCase(),
      capabilities: Array.isArray(capabilities) ? capabilities : [],
      systemPrompt: systemPrompt.trim(),
      subtitle: subtitle || '',
    });

    // Create backing workflow in DB
    const { getDB } = require('../db/database');
    const db = getDB();
    const workflowId = `wf_agent_${agentDef.agent_id}`;
    const triggerId = `${agentDef.agent_id}_trigger`;
    const llmId = `${agentDef.agent_id}_llm`;
    const notifyId = `${agentDef.agent_id}_notify`;

    const nodes = [
      { instanceId: triggerId, nodeType: 'manual_trigger', name: 'Input Trigger', config: {}, position: { x: 100, y: 200 } },
      { instanceId: llmId, nodeType: 'llm_analysis', name: `${agentDef.name} Analysis`, config: { prompt: agentDef.systemPrompt }, position: { x: 400, y: 200 } },
      { instanceId: notifyId, nodeType: 'notification', name: 'Result Output', config: { channel: 'internal', message: 'Agent execution complete' }, position: { x: 700, y: 200 } },
    ];
    const edges = [
      { id: `e_${triggerId}_${llmId}`, fromNodeId: triggerId, toNodeId: llmId },
      { id: `e_${llmId}_${notifyId}`, fromNodeId: llmId, toNodeId: notifyId },
    ];

    db.prepare(
      `INSERT INTO workflows (id, name, description, nodes, edges, status, category, is_agent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 'agent', 1, datetime('now'), datetime('now'))`
    ).run(workflowId, `${agentDef.name} Workflow`, `Backing workflow for ${agentDef.name}`, JSON.stringify(nodes), JSON.stringify(edges));

    db.prepare(
      `INSERT INTO agents (id, name, subtitle, capabilities, status, color, icon, glow, description, system_prompt, workflow_id, created_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(agentDef.agent_id, agentDef.name, agentDef.subtitle, JSON.stringify(agentDef.capabilities), agentDef.color, agentDef.icon, agentDef.glow, agentDef.description, agentDef.systemPrompt, workflowId);

    return res.status(201).json({ success: true, agent: { ...agentDef, workflow_id: workflowId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'AgentCreationFailed', message });
  }
});

// ── Update an agent ──────────────────────────────────────────────────
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, icon, capabilities, systemPrompt, subtitle, status } = req.body;

  try {
    const orchestrator = getOrchestrator();
    const agentManager = orchestrator.getAgentManager();
    const existing = agentManager.getAgent(id);
    if (!existing) {
      return res.status(404).json({ error: 'NotFound', message: `Agent ${id} not found` });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (capabilities !== undefined) updates.capabilities = capabilities;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;
    if (subtitle !== undefined) updates.subtitle = subtitle;
    if (status !== undefined) updates.status = status;

    agentManager.updateAgent(id, updates as any);

    // Update DB
    const { getDB } = require('../db/database');
    const db = getDB();
    const setClauses: string[] = [];
    const values: unknown[] = [];
    if (name !== undefined) { setClauses.push('name = ?'); values.push(name); }
    if (description !== undefined) { setClauses.push('description = ?'); values.push(description); }
    if (icon !== undefined) { setClauses.push('icon = ?'); values.push(icon); }
    if (capabilities !== undefined) { setClauses.push('capabilities = ?'); values.push(JSON.stringify(capabilities)); }
    if (systemPrompt !== undefined) { setClauses.push('system_prompt = ?'); values.push(systemPrompt); }
    if (subtitle !== undefined) { setClauses.push('subtitle = ?'); values.push(subtitle); }
    if (status !== undefined) { setClauses.push('status = ?'); values.push(status); }

    if (setClauses.length > 0) {
      values.push(id);
      db.prepare(`UPDATE agents SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
    }

    // Update backing workflow LLM prompt if systemPrompt changed
    if (systemPrompt !== undefined) {
      const workflowId = `wf_agent_${id}`;
      const wf = db.prepare('SELECT nodes FROM workflows WHERE id = ?').get(workflowId) as any;
      if (wf) {
        const nodes = JSON.parse(wf.nodes);
        const llmNode = nodes.find((n: any) => n.nodeType === 'llm_analysis');
        if (llmNode) {
          llmNode.config.prompt = systemPrompt;
          db.prepare('UPDATE workflows SET nodes = ?, updated_at = datetime(\'now\') WHERE id = ?').run(JSON.stringify(nodes), workflowId);
        }
      }
    }

    return res.json({ success: true, agent: agentManager.getAgent(id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'AgentUpdateFailed', message });
  }
});

// ── Delete an agent ──────────────────────────────────────────────────
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const PROTECTED = ['meeting', 'invoice', 'document'];
  if (PROTECTED.includes(id)) {
    return res.status(403).json({ error: 'Forbidden', message: 'Cannot delete default agents' });
  }

  try {
    const orchestrator = getOrchestrator();
    const agentManager = orchestrator.getAgentManager();
    const existing = agentManager.getAgent(id);
    if (!existing) {
      return res.status(404).json({ error: 'NotFound', message: `Agent ${id} not found` });
    }

    agentManager.deleteAgent(id);

    const { getDB } = require('../db/database');
    const db = getDB();
    const workflowId = `wf_agent_${id}`;
    // Delete workflow runs and their logs
    const runs = db.prepare('SELECT id FROM workflow_runs WHERE workflow_id = ?').all(workflowId);
    for (const run of runs) {
      db.prepare('DELETE FROM workflow_logs WHERE run_id = ?').run(run.id);
    }
    db.prepare('DELETE FROM workflow_runs WHERE workflow_id = ?').run(workflowId);
    db.prepare('DELETE FROM workflows WHERE id = ?').run(workflowId);
    db.prepare('DELETE FROM agents WHERE id = ?').run(id);

    return res.json({ success: true, message: `Agent ${id} deleted` });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ success: false, error: 'AgentDeletionFailed', message });
  }
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

// ── Discover workflows available for agent invocation (Phase 3.2) ────
router.get('/workflows/discover', (req: Request, res: Response) => {
  const { category, tags, triggers } = req.query;
  
  try {
    const orchestrator = getOrchestrator();
    const agentManager = orchestrator.getAgentManager();
    
    const options: any = {};
    if (category) options.category = category as string;
    if (tags) options.tags = (tags as string).split(',');
    if (triggers) options.triggers = (triggers as string).split(',');
    
    const workflows = agentManager.discoverWorkflows(options);
    
    res.json({ 
      success: true,
      workflows,
      count: workflows.length,
      filters: options
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'DiscoveryFailed', message });
  }
});

// ── Invoke workflow from agent (Phase 3.3) ───────────────────────────
router.post('/workflows/:workflowId/invoke', async (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { agentId, context } = req.body;
  
  if (!agentId) {
    return res.status(400).json({ 
      success: false, 
      error: 'ValidationError', 
      message: 'agentId is required' 
    });
  }
  
  try {
    const orchestrator = getOrchestrator();
    const agentManager = orchestrator.getAgentManager();
    
    // Verify agent exists
    const agent = agentManager.getAgent(agentId);
    if (!agent) {
      return res.status(404).json({ 
        success: false, 
        error: 'NotFound', 
        message: 'Agent not found' 
      });
    }
    
    // Invoke workflow
    const result = await agentManager.invokeWorkflow(workflowId, agentId, context || {});
    
    res.json({
      success: result.success,
      agentId,
      workflowId: result.workflowId,
      workflowName: result.workflowName,
      runId: result.runId,
      context: result.context,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: 'InvocationFailed', 
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
