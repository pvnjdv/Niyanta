import { Router, Request, Response } from 'express';
import { workflowTemplates, getTemplateById, getTemplatesByCategory, getTemplatesByTag, getTemplatesByComplexity } from '../templates/workflow-templates';
import { getDB } from '../db/database';
import { v4 as uuid } from 'uuid';

const router = Router();

// GET all templates
router.get('/', (req: Request, res: Response) => {
  const { category, tag, complexity } = req.query;
  
  let templates = workflowTemplates;
  
  if (category) {
    templates = getTemplatesByCategory(category as string);
  } else if (tag) {
    templates = getTemplatesByTag(tag as string);
  } else if (complexity) {
    templates = getTemplatesByComplexity(complexity as any);
  }
  
  res.json({ 
    success: true,
    templates,
    count: templates.length 
  });
});

// GET template by ID
router.get('/:id', (req: Request, res: Response) => {
  const template = getTemplateById(req.params.id);
  
  if (!template) {
    return res.status(404).json({ 
      success: false,
      error: 'NotFound', 
      message: 'Template not found' 
    });
  }
  
  res.json({ 
    success: true,
    template 
  });
});

// POST instantiate template (create workflow from template)
router.post('/:id/instantiate', (req: Request, res: Response) => {
  const { customName, customDescription } = req.body;
  const template = getTemplateById(req.params.id);
  
  if (!template) {
    return res.status(404).json({ 
      success: false,
      error: 'NotFound', 
      message: 'Template not found' 
    });
  }
  
  try {
    const db = getDB();
    const workflowId = uuid();
    const now = new Date().toISOString();
    
    // Generate new node IDs to avoid conflicts
    const nodeIdMap: Record<string, string> = {};
    const newNodes = template.nodes.map(node => {
      const newId = `node-${uuid()}`;
      nodeIdMap[node.id] = newId;
      return {
        instanceId: newId,
        nodeType: node.type,
        name: node.name,
        config: node.config,
        position: node.position,
        retryConfig: {
          maxRetries: 3,
          timeout: 30,
          failurePolicy: 'retry'
        }
      };
    });
    
    // Update edge references with new node IDs
    const newEdges = template.edges.map(edge => ({
      id: `edge-${uuid()}`,
      fromNodeId: nodeIdMap[edge.fromNodeId],
      toNodeId: nodeIdMap[edge.toNodeId],
      condition: edge.condition
    }));
    
    // Create workflow from template
    db.prepare(`
      INSERT INTO workflows (
        id, name, description, nodes, edges, status, category, 
        tags, triggers, allow_agent_invocation, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, 1, ?, ?)
    `).run(
      workflowId,
      customName || template.name,
      customDescription || template.description,
      JSON.stringify(newNodes),
      JSON.stringify(newEdges),
      template.category,
      JSON.stringify(template.tags),
      JSON.stringify(template.triggers),
      now,
      now
    );
    
    const workflow = db.prepare('SELECT * FROM workflows WHERE id = ?').get(workflowId);
    
    res.status(201).json({
      success: true,
      message: 'Workflow created from template',
      workflow,
      templateId: template.id,
      workflowId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false,
      error: 'InstantiationFailed', 
      message 
    });
  }
});

// GET template categories
router.get('/meta/categories', (_req: Request, res: Response) => {
  const categories = [...new Set(workflowTemplates.map(t => t.category))];
  const categoryCounts = categories.map(cat => ({
    category: cat,
    count: workflowTemplates.filter(t => t.category === cat).length
  }));
  
  res.json({
    success: true,
    categories: categoryCounts
  });
});

// GET template tags
router.get('/meta/tags', (_req: Request, res: Response) => {
  const allTags = workflowTemplates.flatMap(t => t.tags);
  const uniqueTags = [...new Set(allTags)];
  const tagCounts = uniqueTags.map(tag => ({
    tag,
    count: allTags.filter(t => t === tag).length
  }));
  
  res.json({
    success: true,
    tags: tagCounts.sort((a, b) => b.count - a.count)
  });
});

export default router;
