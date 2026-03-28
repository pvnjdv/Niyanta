import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';

const router = Router();

// Create a new version (snapshot) of a workflow
router.post('/:workflowId/create', (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { changeSummary, createdBy = 'system' } = req.body;

    const db = getDB();

    // Get current workflow state
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as any;
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get current max version number
    const maxVersionRow = db
      .prepare('SELECT MAX(version_number) as max_version FROM workflow_versions WHERE workflow_id = ?')
      .get(workflowId) as any;
    const nextVersion = (maxVersionRow?.max_version || 0) + 1;

    // Create version snapshot
    const versionId = uuid();
    db.prepare(`
      INSERT INTO workflow_versions (
        id, workflow_id, version_number, name, description, nodes, edges, 
        status, category, tags, triggers, change_summary, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      workflowId,
      nextVersion,
      workflow.name,
      workflow.description,
      workflow.nodes,
      workflow.edges,
      workflow.status,
      workflow.category,
      workflow.tags,
      workflow.triggers,
      changeSummary || 'Version created',
      createdBy
    );

    res.json({
      success: true,
      versionId,
      versionNumber: nextVersion,
      message: `Version ${nextVersion} created successfully`,
    });
  } catch (error: any) {
    console.error('Create version error:', error);
    res.status(500).json({ error: 'Failed to create version' });
  }
});

// List all versions for a workflow
router.get('/:workflowId/list', (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const db = getDB();

    const versions = db
      .prepare(`
        SELECT id, version_number, name, change_summary, created_by, created_at,
               LENGTH(nodes) as nodes_size, LENGTH(edges) as edges_size
        FROM workflow_versions
        WHERE workflow_id = ?
        ORDER BY version_number DESC
      `)
      .all(workflowId) as any[];

    res.json({
      success: true,
      workflowId,
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        name: v.name,
        changeSummary: v.change_summary,
        createdBy: v.created_by,
        createdAt: v.created_at,
        size: {
          nodes: v.nodes_size,
          edges: v.edges_size,
        },
      })),
    });
  } catch (error: any) {
    console.error('List versions error:', error);
    res.status(500).json({ error: 'Failed to list versions' });
  }
});

// Get specific version details
router.get('/:workflowId/versions/:versionNumber', (req: Request, res: Response) => {
  try {
    const { workflowId, versionNumber } = req.params;
    const db = getDB();

    const version = db
      .prepare(`
        SELECT * FROM workflow_versions
        WHERE workflow_id = ? AND version_number = ?
      `)
      .get(workflowId, parseInt(versionNumber, 10)) as any;

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      success: true,
      version: {
        id: version.id,
        workflowId: version.workflow_id,
        versionNumber: version.version_number,
        name: version.name,
        description: version.description,
        nodes: JSON.parse(version.nodes),
        edges: JSON.parse(version.edges),
        status: version.status,
        category: version.category,
        tags: JSON.parse(version.tags || '[]'),
        triggers: JSON.parse(version.triggers || '[]'),
        changeSummary: version.change_summary,
        createdBy: version.created_by,
        createdAt: version.created_at,
      },
    });
  } catch (error: any) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Failed to get version' });
  }
});

// Restore workflow to a specific version
router.post('/:workflowId/restore/:versionNumber', (req: Request, res: Response) => {
  try {
    const { workflowId, versionNumber } = req.params;
    const { createBackup = true, createdBy = 'system' } = req.body;

    const db = getDB();

    // Get the version to restore
    const version = db
      .prepare(`
        SELECT * FROM workflow_versions
        WHERE workflow_id = ? AND version_number = ?
      `)
      .get(workflowId, parseInt(versionNumber, 10)) as any;

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    // Optionally create backup of current state before restoring
    if (createBackup) {
      const currentWorkflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as any;
      if (currentWorkflow) {
        const maxVersionRow = db
          .prepare('SELECT MAX(version_number) as max_version FROM workflow_versions WHERE workflow_id = ?')
          .get(workflowId) as any;
        const backupVersion = (maxVersionRow?.max_version || 0) + 1;

        db.prepare(`
          INSERT INTO workflow_versions (
            id, workflow_id, version_number, name, description, nodes, edges,
            status, category, tags, triggers, change_summary, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuid(),
          workflowId,
          backupVersion,
          currentWorkflow.name,
          currentWorkflow.description,
          currentWorkflow.nodes,
          currentWorkflow.edges,
          currentWorkflow.status,
          currentWorkflow.category,
          currentWorkflow.tags,
          currentWorkflow.triggers,
          `Auto-backup before restoring to v${versionNumber}`,
          createdBy
        );
      }
    }

    // Restore workflow to selected version
    db.prepare(`
      UPDATE workflows
      SET name = ?, description = ?, nodes = ?, edges = ?, status = ?,
          category = ?, tags = ?, triggers = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      version.name,
      version.description,
      version.nodes,
      version.edges,
      version.status,
      version.category,
      version.tags,
      version.triggers,
      workflowId
    );

    res.json({
      success: true,
      message: `Workflow restored to version ${versionNumber}`,
      restoredVersion: parseInt(versionNumber, 10),
    });
  } catch (error: any) {
    console.error('Restore version error:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
});

// Compare two versions
router.get('/:workflowId/compare/:version1/:version2', (req: Request, res: Response) => {
  try {
    const { workflowId, version1, version2 } = req.params;
    const db = getDB();

    const v1 = db
      .prepare(`
        SELECT * FROM workflow_versions
        WHERE workflow_id = ? AND version_number = ?
      `)
      .get(workflowId, parseInt(version1, 10)) as any;

    const v2 = db
      .prepare(`
        SELECT * FROM workflow_versions
        WHERE workflow_id = ? AND version_number = ?
      `)
      .get(workflowId, parseInt(version2, 10)) as any;

    if (!v1 || !v2) {
      return res.status(404).json({ error: 'One or both versions not found' });
    }

    // Parse JSON fields for comparison
    const nodes1 = JSON.parse(v1.nodes);
    const nodes2 = JSON.parse(v2.nodes);
    const edges1 = JSON.parse(v1.edges);
    const edges2 = JSON.parse(v2.edges);

    // Calculate differences
    const nodeIds1 = new Set(nodes1.map((n: any) => n.instanceId));
    const nodeIds2 = new Set(nodes2.map((n: any) => n.instanceId));

    const addedNodes = nodes2.filter((n: any) => !nodeIds1.has(n.instanceId));
    const removedNodes = nodes1.filter((n: any) => !nodeIds2.has(n.instanceId));
    const modifiedNodes = nodes2.filter((n2: any) => {
      const n1 = nodes1.find((n: any) => n.instanceId === n2.instanceId);
      return n1 && JSON.stringify(n1) !== JSON.stringify(n2);
    });

    const edgeIds1 = new Set(edges1.map((e: any) => `${e.fromNodeId}-${e.toNodeId}`));
    const edgeIds2 = new Set(edges2.map((e: any) => `${e.fromNodeId}-${e.toNodeId}`));

    const addedEdges = edges2.filter((e: any) => !edgeIds1.has(`${e.fromNodeId}-${e.toNodeId}`));
    const removedEdges = edges1.filter((e: any) => !edgeIds2.has(`${e.fromNodeId}-${e.toNodeId}`));

    res.json({
      success: true,
      comparison: {
        version1: {
          number: v1.version_number,
          name: v1.name,
          createdAt: v1.created_at,
          nodeCount: nodes1.length,
          edgeCount: edges1.length,
        },
        version2: {
          number: v2.version_number,
          name: v2.name,
          createdAt: v2.created_at,
          nodeCount: nodes2.length,
          edgeCount: edges2.length,
        },
        differences: {
          nodes: {
            added: addedNodes.length,
            removed: removedNodes.length,
            modified: modifiedNodes.length,
            details: {
              added: addedNodes.map((n: any) => ({ id: n.instanceId, name: n.name, type: n.nodeType })),
              removed: removedNodes.map((n: any) => ({ id: n.instanceId, name: n.name, type: n.nodeType })),
              modified: modifiedNodes.map((n: any) => ({ id: n.instanceId, name: n.name, type: n.nodeType })),
            },
          },
          edges: {
            added: addedEdges.length,
            removed: removedEdges.length,
            details: {
              added: addedEdges,
              removed: removedEdges,
            },
          },
          metadata: {
            nameChanged: v1.name !== v2.name,
            descriptionChanged: v1.description !== v2.description,
            statusChanged: v1.status !== v2.status,
            categoryChanged: v1.category !== v2.category,
          },
        },
      },
    });
  } catch (error: any) {
    console.error('Compare versions error:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
});

// Delete a version (soft delete or hard delete based on parameter)
router.delete('/:workflowId/versions/:versionNumber', (req: Request, res: Response) => {
  try {
    const { workflowId, versionNumber } = req.params;
    const db = getDB();

    const result = db
      .prepare('DELETE FROM workflow_versions WHERE workflow_id = ? AND version_number = ?')
      .run(workflowId, parseInt(versionNumber, 10));

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      success: true,
      message: `Version ${versionNumber} deleted successfully`,
    });
  } catch (error: any) {
    console.error('Delete version error:', error);
    res.status(500).json({ error: 'Failed to delete version' });
  }
});

// Get version diff summary
router.get('/:workflowId/diff/:versionNumber', (req: Request, res: Response) => {
  try {
    const { workflowId, versionNumber } = req.params;
    const db = getDB();

    // Get current workflow
    const currentWorkflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId) as any;
    if (!currentWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Get specified version
    const version = db
      .prepare(`
        SELECT * FROM workflow_versions
        WHERE workflow_id = ? AND version_number = ?
      `)
      .get(workflowId, parseInt(versionNumber, 10)) as any;

    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const currentNodes = JSON.parse(currentWorkflow.nodes);
    const versionNodes = JSON.parse(version.nodes);

    res.json({
      success: true,
      diff: {
        current: { nodeCount: currentNodes.length, updatedAt: currentWorkflow.updated_at },
        version: { nodeCount: versionNodes.length, createdAt: version.created_at },
        nodeCountDiff: currentNodes.length - versionNodes.length,
        hasChanges: currentWorkflow.nodes !== version.nodes || currentWorkflow.edges !== version.edges,
      },
    });
  } catch (error: any) {
    console.error('Get diff error:', error);
    res.status(500).json({ error: 'Failed to get diff' });
  }
});

export default router;
