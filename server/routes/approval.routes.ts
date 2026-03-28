import { Router, Request, Response } from 'express';
import { getDB } from '../db/database';
import { WorkflowEngine } from '../core/WorkflowEngine';

const router = Router();
const workflowEngine = new WorkflowEngine();

// GET all pending approvals
router.get('/pending', (req: Request, res: Response) => {
  const { assignedTo, priority, workflowId } = req.query;
  
  const db = getDB();
  let query = 'SELECT * FROM pending_approvals WHERE status = ?';
  const params: any[] = ['PENDING'];
  
  if (assignedTo) {
    query += ' AND assigned_to = ?';
    params.push(assignedTo);
  }
  
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  
  if (workflowId) {
    query += ' AND workflow_id = ?';
    params.push(workflowId);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const approvals = db.prepare(query).all(...params);
  
  // Parse context JSON
  const parsed = approvals.map((a: any) => ({
    ...a,
    context: JSON.parse(a.context || '{}'),
  }));
  
  res.json({ 
    success: true,
    approvals: parsed, 
    count: parsed.length 
  });
});

// GET approval by ID
router.get('/:id', (req: Request, res: Response) => {
  const db = getDB();
  const approval = db.prepare('SELECT * FROM pending_approvals WHERE id = ?').get(req.params.id);
  
  if (!approval) {
    return res.status(404).json({ error: 'NotFound', message: 'Approval not found' });
  }
  
  const parsed = {
    ...(approval as any),
    context: JSON.parse((approval as any).context || '{}'),
  };
  
  res.json({ success: true, approval: parsed });
});

// POST approve
router.post('/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment, data, approvedBy = 'admin' } = req.body;
  
  const db = getDB();
  const approval = db.prepare('SELECT * FROM pending_approvals WHERE id = ?').get(id) as any;
  
  if (!approval) {
    return res.status(404).json({ error: 'NotFound', message: 'Approval not found' });
  }
  
  if (approval.status !== 'PENDING') {
    return res.status(400).json({ 
      error: 'InvalidState', 
      message: `Approval already ${approval.status.toLowerCase()}` 
    });
  }
  
  try {
    const now = new Date().toISOString();
    
    // Update approval record
    db.prepare(`
      UPDATE pending_approvals 
      SET status = 'APPROVED', 
          resolved_at = ?, 
          resolved_by = ?,
          decision_comment = ?,
          decision_data = ?
      WHERE id = ?
    `).run(now, approvedBy, comment || null, data ? JSON.stringify(data) : null, id);
    
    // Resume workflow execution
    const workflowRunId = approval.workflow_run_id;
    
    // Update run status back to RUNNING
    db.prepare(`
      UPDATE workflow_runs 
      SET status = 'RUNNING' 
      WHERE id = ?
    `).run(workflowRunId);
    
    // Get workflow to continue execution
    const run = db.prepare('SELECT * FROM workflow_runs WHERE id = ?').get(workflowRunId) as any;
    
    if (run) {
      // Continue workflow execution from the next node
      const context = JSON.parse(run.context || '{}');
      context.approvalDecision = {
        approved: true,
        comment,
        data,
        approvedBy,
        approvedAt: now,
      };
      
      // Note: Workflow resumption would be handled by WorkflowEngine
      // This is a simplified version - full implementation would need
      // to track which node to resume from
      
      res.json({
        success: true,
        message: 'Approval granted',
        approvalId: id,
        workflowRunId,
        timestamp: now,
      });
    } else {
      res.json({
        success: true,
        message: 'Approval granted but workflow run not found',
        approvalId: id,
        timestamp: now,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'ApproveFailed', message });
  }
});

// POST reject
router.post('/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { comment, reason, rejectedBy = 'admin' } = req.body;
  
  const db = getDB();
  const approval = db.prepare('SELECT * FROM pending_approvals WHERE id = ?').get(id) as any;
  
  if (!approval) {
    return res.status(404).json({ error: 'NotFound', message: 'Approval not found' });
  }
  
  if (approval.status !== 'PENDING') {
    return res.status(400).json({ 
      error: 'InvalidState', 
      message: `Approval already ${approval.status.toLowerCase()}` 
    });
  }
  
  try {
    const now = new Date().toISOString();
    
    // Update approval record
    db.prepare(`
      UPDATE pending_approvals 
      SET status = 'REJECTED', 
          resolved_at = ?, 
          resolved_by = ?,
          decision_comment = ?
      WHERE id = ?
    `).run(now, rejectedBy, comment || reason || null, id);
    
    // Mark workflow as FAILED
    const workflowRunId = approval.workflow_run_id;
    
    db.prepare(`
      UPDATE workflow_runs 
      SET status = 'FAILED',
          error_message = ?,
          completed_at = ?
      WHERE id = ?
    `).run(`Approval rejected: ${comment || reason || 'No reason provided'}`, now, workflowRunId);
    
    res.json({
      success: true,
      message: 'Approval rejected',
      approvalId: id,
      workflowRunId,
      timestamp: now,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: 'RejectFailed', message });
  }
});

// GET approval statistics
router.get('/stats/summary', (req: Request, res: Response) => {
  const db = getDB();
  
  const pending = db.prepare("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'PENDING'").get() as any;
  const approved = db.prepare("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'APPROVED'").get() as any;
  const rejected = db.prepare("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'REJECTED'").get() as any;
  const expired = db.prepare("SELECT COUNT(*) as count FROM pending_approvals WHERE status = 'EXPIRED'").get() as any;
  
  const avgResponseTime = db.prepare(`
    SELECT AVG(
      (julianday(resolved_at) - julianday(created_at)) * 24 * 60
    ) as avg_minutes
    FROM pending_approvals 
    WHERE resolved_at IS NOT NULL
  `).get() as any;
  
  res.json({
    success: true,
    stats: {
      pending: pending.count,
      approved: approved.count,
      rejected: rejected.count,
      expired: expired.count,
      total: pending.count + approved.count + rejected.count + expired.count,
      averageResponseTimeMinutes: avgResponseTime.avg_minutes ? Math.round(avgResponseTime.avg_minutes) : 0,
    }
  });
});

export default router;
