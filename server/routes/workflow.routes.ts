import { Router, Request, Response } from 'express';
import { getDB } from '../db/database';
import { WorkflowEngine } from '../core/WorkflowEngine';
import { WorkflowContext } from '../types/workflow.types';

const router = Router();
const workflowEngine = new WorkflowEngine();

// GET all workflows with optional filtering
router.get('/', (req: Request, res: Response) => {
  const { status, category, published, agentInvocable } = req.query;
  
  const db = getDB();
  let query = 'SELECT * FROM workflows WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (published === 'true') {
    query += ' AND status = ?';
    params.push('active');
  }

  if (agentInvocable === 'true') {
    query += ' AND allow_agent_invocation = 1';
  }

  query += ' ORDER BY updated_at DESC';

  const workflows = db.prepare(query).all(...params);
  res.json({ workflows });
});

// GET workflows available for agent invocation (Phase 3.2)
router.get('/discover', (_req: Request, res: Response) => {
  const db = getDB();
  const workflows = db.prepare(
    'SELECT id, name, description, category, tags, triggers, status FROM workflows WHERE status = ? AND allow_agent_invocation = 1'
  ).all('active');
  
  // Parse JSON fields
  const discovered = workflows.map((wf: any) => ({
    ...wf,
    tags: JSON.parse(wf.tags || '[]'),
    triggers: JSON.parse(wf.triggers || '[]')
  }));
  
  res.json({ workflows: discovered, count: discovered.length });
});

// POST create workflow
router.post('/', (req: Request, res: Response) => {
  const { name, description, nodes, edges, category, tags, triggers, status, metadata } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'ValidationError', message: 'Workflow name is required' });
  }

  const db = getDB();
  const { v4: uuid } = require('uuid');
  const id = uuid();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO workflows (id, name, description, nodes, edges, status, category, tags, triggers, allow_agent_invocation, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      name, 
      description || '', 
      JSON.stringify(nodes || []), 
      JSON.stringify(edges || []), 
      status || 'draft',
      category || 'General', 
      JSON.stringify(tags || []),
      JSON.stringify(triggers || []),
      metadata?.allowAgentInvocation !== false ? 1 : 0,
      now, 
      now
    );

    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
    res.status(201).json({ success: true, workflow, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'CreateWorkflowFailed', message });
  }
});

// GET workflow by ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);

  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  res.json({ success: true, workflow });
});

// PUT update workflow
router.put('/:id', (req: Request, res: Response) => {
  const { name, description, nodes, edges, status, category, tags, triggers, metadata } = req.body;
  const { id } = req.params;

  const db = getDB();
  const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    const now = new Date().toISOString();
    db.prepare(
      `UPDATE workflows SET 
       name = COALESCE(?, name), 
       description = COALESCE(?, description),
       nodes = COALESCE(?, nodes),
       edges = COALESCE(?, edges),
       status = COALESCE(?, status),
       category = COALESCE(?, category),
       tags = COALESCE(?, tags),
       triggers = COALESCE(?, triggers),
       allow_agent_invocation = COALESCE(?, allow_agent_invocation),
       updated_at = ?
       WHERE id = ?`
    ).run(
      name || null,
      description || null,
      nodes ? JSON.stringify(nodes) : null,
      edges ? JSON.stringify(edges) : null,
      status || null,
      category || null,
      tags ? JSON.stringify(tags) : null,
      triggers ? JSON.stringify(triggers) : null,
      metadata?.allowAgentInvocation !== undefined ? (metadata.allowAgentInvocation ? 1 : 0) : null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
    res.json({ success: true, workflow: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'UpdateWorkflowFailed', message });
  }
});

// DELETE workflow
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDB();

  const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    db.prepare('DELETE FROM workflow_runs WHERE workflow_id = ?').run(id);
    db.prepare('DELETE FROM workflows WHERE id = ?').run(id);
    res.json({ success: true, message: 'Workflow deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'DeleteWorkflowFailed', message });
  }
});

// GET workflow runs
router.get('/:id/runs', (req: Request, res: Response) => {
  const db = getDB();
  const runs = db
    .prepare('SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 50')
    .all(req.params.id);

  res.json({ success: true, runs });
});

// GET workflow run by ID
router.get('/:workflowId/runs/:runId', (req: Request, res: Response) => {
  const db = getDB();
  const run = db
    .prepare('SELECT * FROM workflow_runs WHERE id = ? AND workflow_id = ?')
    .get(req.params.runId, req.params.workflowId);

  if (!run) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow run not found' });
  }

  res.json({ success: true, run });
});

// POST execute workflow
router.post('/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { context: initialContext } = req.body;

  const db = getDB();
  const workflow = db.prepare('SELECT status FROM workflows WHERE id = ?').get(id);

  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  if ((workflow as Record<string, unknown>).status === 'disabled') {
    return res.status(400).json({ error: 'WorkflowDisabled', message: 'This workflow is disabled' });
  }

  try {
    // Create a new run
    const runId = workflowEngine.createRun(id, 'api');

    // Execute the workflow
    const result = await workflowEngine.execute(id, runId, initialContext);

    if (result.success) {
      res.status(200).json({
        success: true,
        workflowId: id,
        runId,
        context: result.context,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        workflowId: id,
        runId,
        error: result.error,
        context: result.context,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ExecutionError';
    res.status(500).json({
      success: false,
      error: 'WorkflowExecutionFailed',
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST dry-run workflow (without persisting)
router.post('/:id/dry-run', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { context: initialContext } = req.body;

  const db = getDB();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);

  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    const fakeRunId = `dry-run-${Date.now()}`;
    const result = await workflowEngine.execute(id, fakeRunId, initialContext);

    res.status(200).json({
      success: result.success,
      workflowId: id,
      runId: fakeRunId,
      isDryRun: true,
      context: result.context,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DryRunError';
    res.status(500).json({
      success: false,
      isDryRun: true,
      error: 'WorkflowDryRunFailed',
      message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST publish workflow (change status to active)
router.post('/:id/publish', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDB();

  const workflow = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);
  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    db.prepare('UPDATE workflows SET status = ?, updated_at = ? WHERE id = ?').run('active', new Date().toISOString(), id);
    const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
    res.json({ success: true, workflow: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'PublishFailed', message });
  }
});

// POST unpublish workflow (change status to draft)
router.post('/:id/unpublish', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDB();

  const workflow = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);
  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    db.prepare('UPDATE workflows SET status = ?, updated_at = ? WHERE id = ?').run('draft', new Date().toISOString(), id);
    const updated = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
    res.json({ success: true, workflow: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'UnpublishFailed', message });
  }
});

// GET workflow metrics
router.get('/:id/metrics', (req: Request, res: Response) => {
  const db = getDB();
  const runs = db.prepare('SELECT * FROM workflow_runs WHERE workflow_id = ?').all(req.params.id);

  const completed = (runs as Record<string, unknown>[]).filter((r) => r.status === 'COMPLETED').length;
  const failed = (runs as Record<string, unknown>[]).filter((r) => r.status === 'FAILED').length;
  const pending = (runs as Record<string, unknown>[]).filter((r) => r.status === 'PENDING').length;

  const avgDuration =
    (runs as Record<string, unknown>[]).reduce((sum, run) => {
      const started = new Date(run.started_at as string).getTime();
      const completed = run.completed_at ? new Date(run.completed_at as string).getTime() : Date.now();
      return sum + (completed - started);
    }, 0) / Math.max((runs as Record<string, unknown>[]).length, 1);

  res.json({
    success: true,
    workflowId: req.params.id,
    totalRuns: (runs as Record<string, unknown>[]).length,
    completed,
    failed,
    pending,
    avgDurationMs: Math.round(avgDuration),
    successRate: ((completed / Math.max((runs as Record<string, unknown>[]).length, 1)) * 100).toFixed(2) + '%',
  });
});

// GET agents linked to workflow (Phase 8)
router.get('/:id/agents', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDB();

  // Check if workflow exists
  const workflow = db.prepare('SELECT id FROM workflows WHERE id = ?').get(id);
  if (!workflow) {
    return res.status(404).json({ error: 'NotFound', message: 'Workflow not found' });
  }

  try {
    // Get agents linked to this workflow
    const agents = db.prepare(`
      SELECT a.id as agent_id, a.name, a.icon, a.color
      FROM agents a
      INNER JOIN agent_workflows aw ON a.id = aw.agent_id
      WHERE aw.workflow_id = ?
      ORDER BY a.name
    `).all(id);

    res.json({ success: true, agents, count: (agents as any[]).length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DatabaseError';
    res.status(500).json({ error: 'FetchAgentsFailed', message });
  }
});

export default router;

