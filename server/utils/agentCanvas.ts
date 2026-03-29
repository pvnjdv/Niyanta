const START_NODE_ID = '__start__';
const END_NODE_ID = '__end__';
const EDGE_META_ID = '__edges__';

export interface AgentCanvasBlock {
  id: string;
  blockType: 'workflow' | 'node';
  refId: string;
  name: string;
  category: string;
  color?: string;
  x: number;
  y: number;
  inputInfo: string;
}

export interface AgentCanvasEdge {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

export interface AgentCanvasValidationResult {
  valid: boolean;
  message?: string;
  normalizedLayout: Array<Record<string, unknown>>;
  workflowIds: string[];
  summary: AgentCanvasSummary;
}

export interface AgentCanvasSummary {
  totalBlocks: number;
  workflowBlocks: number;
  nodeBlocks: number;
  branchPoints: number;
  decisionBlocks: number;
  approvalBlocks: number;
  retryBlocks: number;
  auditBlocks: number;
  disconnectedBlocks: string[];
}

export interface AgentCanvasGraph {
  layout: Array<Record<string, unknown>>;
  blocks: AgentCanvasBlock[];
  edges: AgentCanvasEdge[];
  blockById: Map<string, AgentCanvasBlock>;
  adjacency: Map<string, string[]>;
  reverseAdjacency: Map<string, string[]>;
  reachableFromStart: Set<string>;
  canReachEnd: Set<string>;
  summary: AgentCanvasSummary;
}

function canonicalBlockId(item: Record<string, unknown>): string {
  const refId = String(item.refId || '');
  if (refId === START_NODE_ID || refId === END_NODE_ID) {
    return refId;
  }
  return String(item.id || refId || '');
}

function isDecisionLike(block: AgentCanvasBlock): boolean {
  const normalized = `${block.refId} ${block.name}`.toLowerCase();
  return /(decision|switch|condition|threshold|approval request)/.test(normalized);
}

function isMergeLike(block: AgentCanvasBlock): boolean {
  const normalized = `${block.refId} ${block.name}`.toLowerCase();
  return /(merge|parallel|join)/.test(normalized);
}

function sortNodeIds(nodeIds: string[], blockById: Map<string, AgentCanvasBlock>): string[] {
  return [...nodeIds].sort((left, right) => {
    const leftBlock = blockById.get(left);
    const rightBlock = blockById.get(right);
    if (!leftBlock && !rightBlock) return left.localeCompare(right);
    if (!leftBlock) return -1;
    if (!rightBlock) return 1;
    if (leftBlock.x !== rightBlock.x) return leftBlock.x - rightBlock.x;
    if (leftBlock.y !== rightBlock.y) return leftBlock.y - rightBlock.y;
    return left.localeCompare(right);
  });
}

function traverse(startNodeId: string, adjacency: Map<string, string[]>): Set<string> {
  const visited = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);
    (adjacency.get(nodeId) || []).forEach((nextNodeId) => {
      if (!visited.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }

  return visited;
}

export function normalizeCanvasLayout(canvasLayout: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(canvasLayout)) {
    return [];
  }

  return canvasLayout
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({ ...(item as Record<string, unknown>) }));
}

export function parseCanvasEdges(layout: Array<Record<string, unknown>>): AgentCanvasEdge[] {
  const edgeMeta = layout.find((item) => item.refId === EDGE_META_ID);
  if (!edgeMeta?.inputInfo || typeof edgeMeta.inputInfo !== 'string') {
    return [];
  }

  try {
    const rawEdges = JSON.parse(edgeMeta.inputInfo);
    if (!Array.isArray(rawEdges)) {
      return [];
    }

    return rawEdges
      .map((edge, index) => ({
        id: String((edge as Record<string, unknown>).id || `edge-${index}`),
        from: String((edge as Record<string, unknown>).from || (edge as Record<string, unknown>).fromNodeId || ''),
        to: String((edge as Record<string, unknown>).to || (edge as Record<string, unknown>).toNodeId || ''),
        condition: typeof (edge as Record<string, unknown>).condition === 'string'
          ? String((edge as Record<string, unknown>).condition)
          : undefined,
      }))
      .filter((edge) => edge.from && edge.to && edge.from !== edge.to);
  } catch {
    return [];
  }
}

export function buildAgentCanvasGraph(canvasLayout: unknown): AgentCanvasGraph {
  const layout = normalizeCanvasLayout(canvasLayout);
  const blocks: AgentCanvasBlock[] = layout
    .filter((item) => String(item.refId || '') !== EDGE_META_ID)
    .map((item): AgentCanvasBlock => ({
      id: canonicalBlockId(item),
      blockType: item.blockType === 'node' ? 'node' : 'workflow',
      refId: String(item.refId || ''),
      name: String(item.name || item.refId || 'Block'),
      category: String(item.category || 'General'),
      color: typeof item.color === 'string' ? item.color : undefined,
      x: typeof item.x === 'number' ? item.x : 0,
      y: typeof item.y === 'number' ? item.y : 0,
      inputInfo: typeof item.inputInfo === 'string' ? item.inputInfo : '',
    }));
  const blockById = new Map(blocks.map((block) => [block.id, block]));
  const edges = parseCanvasEdges(layout);
  const adjacency = new Map<string, string[]>();
  const reverseAdjacency = new Map<string, string[]>();

  [...blocks.map((block) => block.id), START_NODE_ID, END_NODE_ID].forEach((nodeId) => {
    adjacency.set(nodeId, []);
    reverseAdjacency.set(nodeId, []);
  });

  edges.forEach((edge) => {
    const targets = adjacency.get(edge.from) || [];
    targets.push(edge.to);
    adjacency.set(edge.from, targets);

    const sources = reverseAdjacency.get(edge.to) || [];
    sources.push(edge.from);
    reverseAdjacency.set(edge.to, sources);
  });

  const reachableFromStart = traverse(START_NODE_ID, adjacency);
  const canReachEnd = traverse(END_NODE_ID, reverseAdjacency);
  const actionableBlocks = blocks.filter((block) => block.refId !== START_NODE_ID && block.refId !== END_NODE_ID);
  const disconnectedBlocks = actionableBlocks
    .filter((block) => !reachableFromStart.has(block.id) || !canReachEnd.has(block.id))
    .map((block) => block.name);
  const decisionBlocks = actionableBlocks.filter((block) => isDecisionLike(block));
  const approvalBlocks = actionableBlocks.filter((block) => /approval/i.test(`${block.refId} ${block.name}`));
  const retryBlocks = actionableBlocks.filter((block) => /retry/i.test(`${block.refId} ${block.name}`));
  const auditBlocks = actionableBlocks.filter((block) => /audit/i.test(`${block.refId} ${block.name}`));
  const branchPoints = actionableBlocks.filter((block) => (adjacency.get(block.id) || []).length > 1 || isDecisionLike(block)).length;

  return {
    layout,
    blocks,
    edges,
    blockById,
    adjacency,
    reverseAdjacency,
    reachableFromStart,
    canReachEnd,
    summary: {
      totalBlocks: actionableBlocks.length,
      workflowBlocks: actionableBlocks.filter((block) => block.blockType === 'workflow').length,
      nodeBlocks: actionableBlocks.filter((block) => block.blockType === 'node').length,
      branchPoints,
      decisionBlocks: decisionBlocks.length,
      approvalBlocks: approvalBlocks.length,
      retryBlocks: retryBlocks.length,
      auditBlocks: auditBlocks.length,
      disconnectedBlocks,
    },
  };
}

function resolveSelectedReachability(
  adjacency: Map<string, string[]>,
  selectedNodeIds: Set<string>,
  startNodeId: string,
  memo: Map<string, boolean>
): boolean {
  if (selectedNodeIds.has(startNodeId) || startNodeId === END_NODE_ID) {
    return true;
  }
  if (memo.has(startNodeId)) {
    return memo.get(startNodeId) as boolean;
  }

  memo.set(startNodeId, false);
  const reachable = (adjacency.get(startNodeId) || []).some((nextNodeId) =>
    resolveSelectedReachability(adjacency, selectedNodeIds, nextNodeId, memo)
  );
  memo.set(startNodeId, reachable);
  return reachable;
}

export function resolveCanvasExecutionOrder(canvasLayout: unknown, selectedNodeIds: string[] = []): AgentCanvasBlock[] {
  const graph = buildAgentCanvasGraph(canvasLayout);
  const selectedSet = new Set(selectedNodeIds.filter(Boolean));
  const memo = new Map<string, boolean>();
  const visited = new Set<string>();
  const ordered: AgentCanvasBlock[] = [];
  const queue = [START_NODE_ID];

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const block = graph.blockById.get(nodeId);
    if (block && block.refId !== START_NODE_ID && block.refId !== END_NODE_ID) {
      if (selectedSet.size === 0 || selectedSet.has(block.id)) {
        ordered.push(block);
      }
    }

    let nextNodes = sortNodeIds(graph.adjacency.get(nodeId) || [], graph.blockById);
    if (selectedSet.size > 0) {
      const selectedNextNodes = nextNodes.filter((nextNodeId) =>
        resolveSelectedReachability(graph.adjacency, selectedSet, nextNodeId, memo)
      );
      if (selectedNextNodes.length > 0) {
        nextNodes = selectedNextNodes;
      }
    }

    nextNodes.forEach((nextNodeId) => {
      if (!visited.has(nextNodeId)) {
        queue.push(nextNodeId);
      }
    });
  }

  return ordered;
}

export function extractWorkflowIdsFromCanvas(canvasLayout: unknown, selectedNodeIds: string[] = []): string[] {
  return resolveCanvasExecutionOrder(canvasLayout, selectedNodeIds)
    .filter((block) => block.blockType === 'workflow')
    .map((block) => block.refId)
    .filter((workflowId, index, workflowIds) => workflowId && workflowIds.indexOf(workflowId) === index);
}

export function validateAgentCanvasLayout(canvasLayout: unknown): AgentCanvasValidationResult {
  const graph = buildAgentCanvasGraph(canvasLayout);
  const { blocks, edges, adjacency, reverseAdjacency, summary } = graph;

  if (graph.layout.length === 0) {
    return {
      valid: true,
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  const actionableBlocks = blocks.filter((block) => block.refId !== START_NODE_ID && block.refId !== END_NODE_ID);
  const workflowBlocks = actionableBlocks.filter((block) => block.blockType === 'workflow');
  const validNodeIds = new Set<string>([START_NODE_ID, END_NODE_ID, ...actionableBlocks.map((block) => block.id)]);
  const hasInvalidEdge = edges.some((edge) => !validNodeIds.has(edge.from) || !validNodeIds.has(edge.to));
  if (hasInvalidEdge) {
    return {
      valid: false,
      message: 'The agent canvas contains broken connections. Remove invalid edges and try again.',
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  if (workflowBlocks.length === 0) {
    return {
      valid: false,
      message: 'Add at least one workflow block to the agent canvas before saving.',
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  if (edges.length === 0 || !(adjacency.get(START_NODE_ID) || []).length) {
    return {
      valid: false,
      message: 'Connect the Input node to your workflow path before saving the agent.',
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  if (!(reverseAdjacency.get(END_NODE_ID) || []).length) {
    return {
      valid: false,
      message: 'Connect at least one block to the Niyanta output node before saving the agent.',
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  if (!graph.reachableFromStart.has(END_NODE_ID)) {
    return {
      valid: false,
      message: 'The canvas must form a complete path from Input to Niyanta output.',
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  if (summary.disconnectedBlocks.length > 0) {
    return {
      valid: false,
      message: `Disconnected blocks detected: ${summary.disconnectedBlocks.join(', ')}.`,
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  const invalidDecisionBlock = actionableBlocks.find((block) => isDecisionLike(block) && (adjacency.get(block.id) || []).length < 2);
  if (invalidDecisionBlock) {
    return {
      valid: false,
      message: `Decision block "${invalidDecisionBlock.name}" needs at least two outgoing connections.`,
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  const invalidMergeBlock = actionableBlocks.find((block) => isMergeLike(block) && (reverseAdjacency.get(block.id) || []).length < 2);
  if (invalidMergeBlock) {
    return {
      valid: false,
      message: `Merge block "${invalidMergeBlock.name}" needs at least two incoming connections.`,
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  const deadEndBlock = actionableBlocks.find((block) => (adjacency.get(block.id) || []).length === 0);
  if (deadEndBlock) {
    return {
      valid: false,
      message: `Block "${deadEndBlock.name}" does not route to the Niyanta output.`,
      normalizedLayout: graph.layout,
      workflowIds: [],
      summary,
    };
  }

  return {
    valid: true,
    normalizedLayout: graph.layout,
    workflowIds: extractWorkflowIdsFromCanvas(graph.layout),
    summary,
  };
}