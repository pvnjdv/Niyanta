import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const db = getDB();
  const workflows = db.prepare('SELECT * FROM workflows ORDER BY updated_at DESC').all();
  res.json({ workflows });
});

router.post('/', (req: Request, res: Response) => {
  const { name, description, nodes, edges, category } = req.body;
  const db = getDB();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO workflows (id, name, description, nodes, edges, status, category, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?)
  `).run(id, name, description || '', JSON.stringify(nodes || []), JSON.stringify(edges || []), category || 'custom', now, now);

  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id);
  res.status(201).json({ workflow });
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  return res.json({ workflow });
});

router.get('/:id/runs', (req: Request, res: Response) => {
  const db = getDB();
  const runs = db.prepare('SELECT * FROM workflow_runs WHERE workflow_id = ? ORDER BY started_at DESC LIMIT 20').all(req.params.id);
  res.json({ runs });
});

export default router;
