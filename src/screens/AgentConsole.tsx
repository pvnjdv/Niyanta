import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { SAMPLES } from '../constants/samples';

interface AgentConsoleProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
  runAllProgress: string | null;
  onRunAll: () => Promise<void>;
  refreshAgents: () => Promise<void>;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({
  agents, agentStates, onExecuteAgent, runAllProgress, onRunAll, refreshAgents,
}) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const location = useLocation();

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [inputText, setInputText] = useState('');
  const [linkedWorkflows, setLinkedWorkflows] = useState<Array<{workflow_id: string; name: string; description: string; category: string; can_trigger: number}>>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingAgent, setRenamingAgent] = useState<{ id: string; name: string } | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [detailAgentId, setDetailAgentId] = useState<string | null>(null);
  const [detailLinkedWorkflows, setDetailLinkedWorkflows] = useState<Array<{workflow_id: string; name: string; description: string; category: string; can_trigger: number}>>([]);

  // Canvas state (for /agents/new or editing)
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentCapabilities, setAgentCapabilities] = useState('');
  const [agentColor, setAgentColor] = useState('#00D4FF');
  const [reportToNiyanta, setReportToNiyanta] = useState(true);
  const [autoProcess, setAutoProcess] = useState(true);
  const [availableWorkflows, setAvailableWorkflows] = useState<Array<{id: string; name: string; description: string; category: string; status?: string}>>([]);
  const [canvasNodes, setCanvasNodes] = useState<Array<{
    id: string; blockType: 'workflow' | 'node'; refId: string;
    name: string; category: string; color: string;
    x: number; y: number; inputInfo: string;
  }>>([]);;
  const [startNodePos, setStartNodePos] = useState({ x: 60, y: 80 });
  const [endNodePos, setEndNodePos] = useState({ x: 900, y: 80 });
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'workflows' | 'nodes'>('workflows');
  const [expandedNodeCats, setExpandedNodeCats] = useState<Set<string>>(new Set(['AI & LLM', 'Actions']));
  const [nodeSearch, setNodeSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedAgentChanges, setHasUnsavedAgentChanges] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  // Canvas refs
  const [agentEdges, setAgentEdges] = useState<Array<{ id: string; from: string; to: string }>>([]);
  const [wiringPreview, setWiringPreview] = useState<{ x: number; y: number } | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingNode = useRef<{ nodeId: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const panningCanvas = useRef<{ startX: number; startY: number; originPanX: number; originPanY: number } | null>(null);
  const hydratedAgentIdRef = useRef<string | null>(null);
  const wiringFrom = useRef<{ nodeId: string } | null>(null);

  const selectedAgent = agentId && agentId !== 'new' ? agents.find(a => a.id === agentId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;
  const templateAgents = agents.filter(a => a.isTemplate);
  const filtered = agents.filter(
    a => !a.isTemplate && a.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pre-fill canvas when editing an existing agent (from three-dot Edit)
  useEffect(() => {
    const state = location.state as { editAgent?: Agent; editAgentId?: string } | null;
    if (agentId !== 'new' || !state?.editAgent) return;

    const ea = state.editAgent;
    const editId = state.editAgentId || ea.id;
    setAgentName(ea.name);
    setAgentDescription(ea.description || '');
    setAgentCapabilities(ea.capabilities?.join(', ') || '');
    setAgentColor(ea.color || '#00D4FF');
    setEditingAgentId(editId);
    setHasUnsavedAgentChanges(false);
    setCanvasNodes([]);
    setAgentEdges([]);
    setStartNodePos({ x: 60, y: 80 });
    setEndNodePos({ x: 900, y: 80 });

    const hydrateEditCanvas = async () => {
      try {
        const res = await fetch(`/api/agent/${editId}/workflows`);
        if (!res.ok) return;
        const data = await res.json();
        const layout = Array.isArray(data.canvasLayout) ? data.canvasLayout : [];
        if (layout.length > 0) {
          const startLayout = layout.find((n: any) => n?.refId === '__start__');
          const endLayout = layout.find((n: any) => n?.refId === '__end__');
          if (typeof startLayout?.x === 'number' && typeof startLayout?.y === 'number') {
            setStartNodePos({ x: startLayout.x, y: startLayout.y });
          }
          if (typeof endLayout?.x === 'number' && typeof endLayout?.y === 'number') {
            setEndNodePos({ x: endLayout.x, y: endLayout.y });
          }

          const pipelineLayout = layout.filter((n: any) => n?.refId !== '__start__' && n?.refId !== '__end__');
          const pipelineNonMeta = pipelineLayout.filter((n: any) => n?.refId !== '__edges__');
          const mappedNodes = pipelineNonMeta.map((n: any, i: number) => ({
            id: n.id || `cn-edit-${Date.now()}-${i}`,
            blockType: n.blockType === 'node' ? 'node' : 'workflow',
            refId: n.refId || '',
            name: n.name || 'Block',
            category: n.category || 'General',
            color: n.color || getCategoryColor(n.category || 'General'),
            x: typeof n.x === 'number' ? n.x : 320,
            y: typeof n.y === 'number' ? n.y : 80,
            inputInfo: n.inputInfo || '',
          }));
          setCanvasNodes(mappedNodes);

          const edgesEntry = layout.find((n: any) => n?.refId === '__edges__');
          let parsedEdges: any[] = [];
          try { parsedEdges = edgesEntry?.inputInfo ? JSON.parse(edgesEntry.inputInfo) : []; } catch { parsedEdges = []; }
          const validNodeIds = new Set<string>(['__start__', '__end__', ...mappedNodes.map((node: { id: string }) => node.id)]);
          setAgentEdges(normalizeEdges(parsedEdges, validNodeIds));
          return;
        }
      } catch {
        // Best effort hydration; keep current canvas if unavailable.
      }
    };
    hydrateEditCanvas();
  }, [agentId]);

  // Hydrate canvas when navigating directly to an existing agent (/agents/:id)
  useEffect(() => {
    if (!agentId || agentId === 'new') {
      hydratedAgentIdRef.current = null;
      return;
    }
    // If opened via three-dot Edit (location.state), the other effect handles it
    const state = location.state as { editAgent?: Agent } | null;
    if (state?.editAgent) return;
    // Avoid re-hydrating after refreshAgents() is called on save
    if (hydratedAgentIdRef.current === agentId) return;

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return; // agents not loaded yet — will retry when `agents` prop changes

    hydratedAgentIdRef.current = agentId;
    setAgentName(agent.name);
    setAgentDescription(agent.description || '');
    setAgentCapabilities(agent.capabilities?.join(', ') || '');
    setAgentColor(agent.color || '#00D4FF');
    setEditingAgentId(agentId);
    setHasUnsavedAgentChanges(false);
    setLastSaved(null);
    setCanvasNodes([]);
    setAgentEdges([]);
    setStartNodePos({ x: 60, y: 80 });
    setEndNodePos({ x: 900, y: 80 });

    const hydrateCanvas = async () => {
      try {
        const res = await fetch(`/api/agent/${agentId}/workflows`);
        if (!res.ok) return;
        const data = await res.json();
        const layout = Array.isArray(data.canvasLayout) ? data.canvasLayout : [];

        const startAnchor = layout.find((n: any) => n?.refId === '__start__');
        const endAnchor = layout.find((n: any) => n?.refId === '__end__');
        if (typeof startAnchor?.x === 'number') setStartNodePos({ x: startAnchor.x, y: startAnchor.y });
        if (typeof endAnchor?.x === 'number') setEndNodePos({ x: endAnchor.x, y: endAnchor.y });

        const pipeline = layout.filter((n: any) => n?.refId !== '__start__' && n?.refId !== '__end__');
        const pipelineClean = pipeline.filter((n: any) => n?.refId !== '__edges__');
        const mappedNodes = pipelineClean.map((n: any, i: number) => ({
          id: n.id || `cn-${agentId}-${i}`,
          blockType: n.blockType === 'node' ? 'node' as const : 'workflow' as const,
          refId: n.refId || '',
          name: n.name || 'Block',
          category: n.category || 'General',
          color: n.color || getCategoryColor(n.category || 'General'),
          x: typeof n.x === 'number' ? n.x : 320,
          y: typeof n.y === 'number' ? n.y : 80,
          inputInfo: n.inputInfo || '',
        }));
        setCanvasNodes(mappedNodes);

        const edgesEntry2 = layout.find((n: any) => n?.refId === '__edges__');
        let parsedEdges: any[] = [];
        try { parsedEdges = edgesEntry2?.inputInfo ? JSON.parse(edgesEntry2.inputInfo) : []; } catch { parsedEdges = []; }
        const validNodeIds = new Set<string>(['__start__', '__end__', ...mappedNodes.map((node: { id: string }) => node.id)]);
        setAgentEdges(normalizeEdges(parsedEdges, validNodeIds));
      } catch {
        // best effort
      }
    };
    hydrateCanvas();
  }, [agentId, agents]);

  // ── Fetch workflows ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch('/api/workflow');
        if (res.ok) {
          const data = await res.json();
          setAvailableWorkflows(data.workflows || []);
        }
      } catch (err) {
        console.error('Failed to fetch workflows:', err);
      }
    };
    fetchWorkflows();
  }, []);

  useEffect(() => {
    const fetchLinkedWorkflows = async () => {
      if (!agentId || agentId === 'new') { setLinkedWorkflows([]); return; }
      try {
        const res = await fetch(`/api/agent/${agentId}/workflows`);
        if (res.ok) {
          const data = await res.json();
          setLinkedWorkflows(data.workflows || []);
        }
      } catch (err) {
        console.error('Failed to fetch linked workflows:', err);
      }
    };
    fetchLinkedWorkflows();
  }, [agentId]);

  useEffect(() => {
    if (!detailAgentId) { setDetailLinkedWorkflows([]); return; }
    fetch(`/api/agent/${detailAgentId}/workflows`)
      .then(r => r.ok ? r.json() : { workflows: [] })
      .then(d => setDetailLinkedWorkflows(d.workflows || []))
      .catch(() => setDetailLinkedWorkflows([]));
  }, [detailAgentId]);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.action-btn')) return;
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  // ── Canvas helpers ─────────────────────────────────────────────────────────
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Finance': '#059669', 'HR': '#EC4899', 'Operations': '#3B82F6',
      'Security': '#EF4444', 'Compliance': '#F59E0B', 'IT': '#7C3AED',
      'Document Processing': '#06B6D4', 'General': '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const normalizeEdges = (
    rawEdges: any,
    validNodeIds: Set<string>
  ): Array<{ id: string; from: string; to: string }> => {
    if (!Array.isArray(rawEdges)) return [];
    const seen = new Set<string>();
    const out: Array<{ id: string; from: string; to: string }> = [];
    for (let i = 0; i < rawEdges.length; i++) {
      const e = rawEdges[i] || {};
      const from = typeof e.from === 'string' ? e.from : (typeof e.fromNodeId === 'string' ? e.fromNodeId : '');
      const to = typeof e.to === 'string' ? e.to : (typeof e.toNodeId === 'string' ? e.toNodeId : '');
      if (!from || !to || from === to) continue;
      if (!validNodeIds.has(from) || !validNodeIds.has(to)) continue;
      const key = `${from}=>${to}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ id: typeof e.id === 'string' && e.id ? e.id : `e-${Date.now()}-${i}`, from, to });
    }
    return out;
  };

  // Returns canvas-space position of a node's left or right connection handle
  const getHandlePos = (nodeId: string, side: 'left' | 'right') => {
    if (nodeId === '__start__') return { x: startNodePos.x + (side === 'right' ? 200 : 0), y: startNodePos.y + 50 };
    if (nodeId === '__end__')   return { x: endNodePos.x   + (side === 'right' ? 200 : 0), y: endNodePos.y   + 50 };
    const node = canvasNodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + (side === 'right' ? 240 : 0), y: node.y + 65 };
  };

  const getRoleColor = (role: string) => {
    return role === 'input' ? '#3B82F6' : role === 'process' ? '#F59E0B' : '#059669';
  };

  const NODE_PALETTE = [
    { category: 'AI & LLM', color: '#7C3AED', nodes: ['LLM Analysis', 'Summarization', 'Classification', 'Translation', 'Risk Analysis', 'Sentiment Analysis'] },
    { category: 'Data', color: '#059669', nodes: ['Read Data', 'Write Data', 'Transform', 'Filter', 'Aggregate', 'Validation'] },
    { category: 'Actions', color: '#F59E0B', nodes: ['Send Email', 'Notification', 'Approval Request', 'Task Assignment', 'HTTP Request'] },
    { category: 'Logic', color: '#6B7280', nodes: ['Decision', 'Switch', 'Condition', 'Delay', 'Retry', 'Merge'] },
    { category: 'Output', color: '#06B6D4', nodes: ['JSON Export', 'CSV Export', 'PDF Report', 'Dashboard Update', 'Alert'] },
  ];

  const getNextCanvasPosition = () => {
    const index = canvasNodes.length;
    return {
      x: 320 + (index % 3) * 280,
      y: 80 + Math.floor(index / 3) * 160,
    };
  };

  const addWorkflowToCanvas = (workflow: {id: string; name: string; category: string}) => {
    if (canvasNodes.some(n => n.blockType === 'workflow' && n.refId === workflow.id)) return;
    const nextPos = getNextCanvasPosition();
    setCanvasNodes(prev => [...prev, {
      id: `wn-${Date.now()}`,
      blockType: 'workflow' as const,
      refId: workflow.id,
      name: workflow.name,
      category: workflow.category,
      color: getCategoryColor(workflow.category),
      x: nextPos.x,
      y: nextPos.y,
      inputInfo: '',
    }]);
    setHasUnsavedAgentChanges(true);
  };

  const addNodeToCanvas = (nodeName: string, category: string, color: string) => {
    const nextPos = getNextCanvasPosition();
    setCanvasNodes(prev => [...prev, {
      id: `nn-${Date.now()}`,
      blockType: 'node' as const,
      refId: nodeName,
      name: nodeName,
      category,
      color,
      x: nextPos.x,
      y: nextPos.y,
      inputInfo: '',
    }]);
    setHasUnsavedAgentChanges(true);
  };

  const removeNodeFromCanvas = (nodeId: string) => {
    setCanvasNodes(prev => prev.filter(n => n.id !== nodeId));
    setAgentEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    setSelectedNode(null);
    setHasUnsavedAgentChanges(true);
  };

  const deleteEdge = (edgeId: string) => {
    setAgentEdges(prev => prev.filter(e => e.id !== edgeId));
    setHasUnsavedAgentChanges(true);
  };

  const handleSaveAgent = async () => {
    if (!agentName.trim()) return;
    setIsSaving(true);
    const payload = {
      name: agentName.trim(),
      description: agentDescription.trim(),
      capabilities: agentCapabilities.trim(),
      workflows: canvasNodes.filter(n => n.blockType === 'workflow').map(n => n.refId),
      config: {
        reportToNiyanta,
        autoProcess,
        canvasLayout: canvasNodes.map(n => ({
          id: n.id, blockType: n.blockType, refId: n.refId,
          name: n.name, category: n.category, x: n.x, y: n.y, inputInfo: n.inputInfo,
        })).concat([
          { id: 'anchor-start', blockType: 'workflow' as const, refId: '__start__', name: 'Start', category: 'anchor', x: startNodePos.x, y: startNodePos.y, inputInfo: '' },
          { id: 'anchor-end', blockType: 'workflow' as const, refId: '__end__', name: 'End', category: 'anchor', x: endNodePos.x, y: endNodePos.y, inputInfo: '' },
          { id: '__edges__', blockType: 'workflow' as const, refId: '__edges__', name: '__edges__', category: 'meta', x: 0, y: 0, inputInfo: JSON.stringify(agentEdges) },
        ]),
      },
    };
    try {
      const res = editingAgentId
        ? await fetch(`/api/agent/${editingAgentId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/agent', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        setLastSaved(new Date());
        setHasUnsavedAgentChanges(false);
        await refreshAgents();
        if (!editingAgentId) {
          // Only navigate away when creating a new agent
          setTimeout(() => navigate('/agents'), 300);
        }
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`Failed to save agent: ${d.message || res.status}`);
      }
    } catch (err) {
      alert(`Failed to save agent: ${err instanceof Error ? err.message : 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseTemplate = async (template: Agent) => {
    setAgentName(template.name);
    setAgentDescription(template.description);
    setAgentCapabilities(template.capabilities.join(', '));
    setAgentColor(template.color);
    setEditingAgentId(null);
    setHasUnsavedAgentChanges(true);

    // Load canvas layout from template so all its nodes/workflows appear in editor
    try {
      const res = await fetch(`/api/agent/${template.id}/workflows`);
      if (res.ok) {
        const data = await res.json();
        const layout = Array.isArray(data.canvasLayout) ? data.canvasLayout : [];
        const startAnchor = layout.find((n: any) => n?.refId === '__start__');
        const endAnchor = layout.find((n: any) => n?.refId === '__end__');
        setStartNodePos(typeof startAnchor?.x === 'number' ? { x: startAnchor.x, y: startAnchor.y } : { x: 60, y: 80 });
        setEndNodePos(typeof endAnchor?.x === 'number' ? { x: endAnchor.x, y: endAnchor.y } : { x: 900, y: 80 });
        const pipeline = layout.filter((n: any) => n?.refId !== '__start__' && n?.refId !== '__end__');
        const pipelineTmpl = pipeline.filter((n: any) => n?.refId !== '__edges__');
        const mappedNodes = pipelineTmpl.map((n: any, i: number) => ({
          id: `cn-tmpl-${Date.now()}-${i}`,
          blockType: n.blockType === 'node' ? 'node' as const : 'workflow' as const,
          refId: n.refId || '',
          name: n.name || 'Block',
          category: n.category || 'General',
          color: n.color || getCategoryColor(n.category || 'General'),
          x: typeof n.x === 'number' ? n.x : 320,
          y: typeof n.y === 'number' ? n.y : 80,
          inputInfo: n.inputInfo || '',
        }));
        setCanvasNodes(mappedNodes);

        const tmplEdgesEntry = layout.find((n: any) => n?.refId === '__edges__');
        let parsedEdges: any[] = [];
        try { parsedEdges = tmplEdgesEntry?.inputInfo ? JSON.parse(tmplEdgesEntry.inputInfo) : []; } catch { parsedEdges = []; }
        const validNodeIds = new Set<string>(['__start__', '__end__', ...mappedNodes.map((node: { id: string }) => node.id)]);
        setAgentEdges(normalizeEdges(parsedEdges, validNodeIds));
      } else {
        setCanvasNodes([]);
        setAgentEdges([]);
        setStartNodePos({ x: 60, y: 80 });
        setEndNodePos({ x: 900, y: 80 });
      }
    } catch {
      setCanvasNodes([]);
      setAgentEdges([]);
      setStartNodePos({ x: 60, y: 80 });
      setEndNodePos({ x: 900, y: 80 });
    }

    setShowTemplates(false);
    navigate('/agents/new');
  };

  const handleRename = async () => {
    if (!renamingAgent || !renameValue.trim()) return;
    try {
      const res = await fetch(`/api/agent/${renamingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(`Rename failed: ${d.message || res.status}`); return; }
      await refreshAgents();
    } catch (err) {
      alert(`Rename failed: ${err instanceof Error ? err.message : 'Network error'}`);
    }
    setRenamingAgent(null);
  };

  const handleSetMaintenance = async (agentId: string, agentName: string) => {
    if (!confirm(`Put "${agentName}" into maintenance mode? It will be paused and unavailable for execution.`)) return;
    try {
      const res = await fetch(`/api/agent/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'maintenance' }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(`Failed: ${d.message || res.status}`); return; }
      await refreshAgents();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/agent/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await refreshAgents();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(`Delete failed: ${d.message || `Server returned ${res.status}`}`);
      }
    } catch (err) {
      alert(`Delete failed: ${err instanceof Error ? err.message : 'Network error'}`);
    }
  };

  // ── Canvas mouse handlers ──────────────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as Element;
    const tag = target.nodeName.toLowerCase();
    const isBackground = target === canvasRef.current
      || target.classList.contains('canvas-grid')
      || tag === 'svg' || tag === 'g';
    if (isBackground) {
      wiringFrom.current = null;
      setWiringPreview(null);
      panningCanvas.current = { startX: e.clientX, startY: e.clientY, originPanX: canvasPan.x, originPanY: canvasPan.y };
      setSelectedNode(null);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = canvasNodes.find(n => n.id === nodeId);
    if (!node) return;
    draggingNode.current = { nodeId, startX: e.clientX, startY: e.clientY, originX: node.x, originY: node.y };
    setSelectedNode(nodeId);
  };

  const handleAnchorMouseDown = (e: React.MouseEvent, anchor: 'start' | 'end') => {
    e.stopPropagation();
    const origin = anchor === 'start' ? startNodePos : endNodePos;
    draggingNode.current = {
      nodeId: anchor === 'start' ? '__start__' : '__end__',
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
    };
    setSelectedNode(null);
  };

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (wiringFrom.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = canvasZoom / 100;
      setWiringPreview({
        x: (e.clientX - rect.left - canvasPan.x) / scale,
        y: (e.clientY - rect.top  - canvasPan.y) / scale,
      });
      return;
    }
    if (draggingNode.current) {
      const { nodeId, startX, startY, originX, originY } = draggingNode.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const scale = canvasZoom / 100;

      if (nodeId === '__start__') {
        setStartNodePos({ x: originX + dx / scale, y: originY + dy / scale });
        setHasUnsavedAgentChanges(true);
        return;
      }

      if (nodeId === '__end__') {
        setEndNodePos({ x: originX + dx / scale, y: originY + dy / scale });
        setHasUnsavedAgentChanges(true);
        return;
      }

      setCanvasNodes(prev => prev.map(n =>
        n.id === nodeId
          ? { ...n, x: originX + dx / scale, y: originY + dy / scale }
          : n
      ));
      setHasUnsavedAgentChanges(true);
    }
    if (panningCanvas.current) {
      setCanvasPan({
        x: panningCanvas.current.originPanX + (e.clientX - panningCanvas.current.startX),
        y: panningCanvas.current.originPanY + (e.clientY - panningCanvas.current.startY),
      });
    }
  }, [canvasZoom, canvasPan]);

  const handleCanvasMouseUp = () => {
    draggingNode.current = null;
    panningCanvas.current = null;
    wiringFrom.current = null;
    setWiringPreview(null);
  };

  const handleRun = async () => {
    if (!agentId || agentId === 'new') return;
    const input = inputText.trim() || SAMPLES[agentId] || '';
    setInputText('');
    await onExecuteAgent(agentId, input);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CANVAS VIEW — /agents/new (create) or /agents/:id (edit)
  // ══════════════════════════════════════════════════════════════════════════
  if (agentId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {/* ── Top Toolbar ────────────────────────────────────────────────── */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          borderBottom: '1px solid var(--border)', background: 'var(--bg-dock)', flexShrink: 0,
        }}>
          <button onClick={() => navigate('/agents')} style={{
            height: 36, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>← Back</button>

          {selectedAgent && (
            <div style={{
              width: 34, height: 34, borderRadius: 8, background: agentColor,
              display: 'grid', placeItems: 'center', color: '#fff',
              fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
              boxShadow: `0 3px 10px ${agentColor}70`, flexShrink: 0,
            }}>{selectedAgent.icon}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 420 }}>
            <input
              value={agentName}
              onChange={e => { setAgentName(e.target.value); setHasUnsavedAgentChanges(true); }}
              placeholder="Agent name..."
              style={{
                height: 32, padding: '0 12px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                background: 'transparent', border: '1px solid transparent', flex: 1,
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => { e.target.style.border = '1px solid var(--border)'; e.target.style.background = 'var(--bg-tile)'; }}
              onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent'; }}
            />
            {hasUnsavedAgentChanges && (
              <div
                title="Unsaved changes"
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }}
              />
            )}
            {lastSaved && !hasUnsavedAgentChanges && (
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                title={lastSaved.toLocaleString()}
              >
                Saved {(() => {
                  const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
                  if (seconds < 60) return 'just now';
                  const minutes = Math.floor(seconds / 60);
                  if (minutes < 60) return `${minutes}m ago`;
                  const hours = Math.floor(minutes / 60);
                  return `${hours}h ago`;
                })()}
              </span>
            )}
          </div>

          <div style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            background: 'rgba(0, 212, 255, 0.12)', color: '#00D4FF', border: '1px solid rgba(0, 212, 255, 0.3)',
          }}>AI AGENT</div>

          {reportToNiyanta && (
            <div style={{
              padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
              background: 'rgba(139, 92, 246, 0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)',
            }}>REPORTS TO NIYANTA</div>
          )}

          <div style={{ flex: 1 }} />

          {editingAgentId && (
            <>
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
                placeholder="Run agent with input..."
                style={{
                  width: 260, height: 32, padding: '0 12px',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 12,
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <button
                onClick={handleRun}
                disabled={selectedState?.status === 'processing'}
                style={{
                  height: 32, padding: '0 16px', borderRadius: 4, fontWeight: 600,
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: selectedState?.status === 'processing' ? 'var(--bg-tile)' : 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  color: selectedState?.status === 'processing' ? 'var(--text-muted)' : 'var(--accent)',
                  cursor: selectedState?.status === 'processing' ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{selectedState?.status === 'processing' ? '■' : '▶'}</span>
                <span>{selectedState?.status === 'processing' ? 'RUNNING...' : 'RUN'}</span>
              </button>
            </>
          )}

          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <button onClick={handleSaveAgent} disabled={!agentName.trim() || isSaving} style={{
            height: 32, padding: '0 16px', borderRadius: 4, fontWeight: 600,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            background: agentName.trim() ? 'var(--accent-dim)' : 'var(--bg-tile)',
            border: '1px solid var(--accent-border)',
            color: agentName.trim() ? 'var(--accent)' : 'var(--text-muted)',
            cursor: agentName.trim() ? 'pointer' : 'not-allowed',
          }}>{isSaving ? 'SAVING...' : editingAgentId ? 'SAVE CHANGES' : 'SAVE AGENT'}</button>
        </div>

        {/* ── Main Area ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left: Block Palette ───────────────────────────────────────── */}
          <div style={{
            width: 280, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              {(['workflows', 'nodes'] as const).map(tab => (
                <button key={tab} onClick={() => setLeftTab(tab)} style={{
                  flex: 1, height: 40, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: leftTab === tab ? 'var(--bg-base)' : 'var(--bg-panel)',
                  color: leftTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: leftTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                }}>{tab}</button>
              ))}
            </div>

            {/* Search */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <input
                value={nodeSearch} onChange={e => setNodeSearch(e.target.value)}
                placeholder={leftTab === 'workflows' ? 'Search workflows...' : 'Search nodes...'}
                style={{
                  width: '100%', height: 30, padding: '0 10px', fontSize: 11,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {leftTab === 'workflows' ? (
                availableWorkflows.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No workflows available.<br />Create workflows first in Workflow Studio.
                  </div>
                ) : (
                  availableWorkflows
                    .filter(wf => !nodeSearch || wf.name.toLowerCase().includes(nodeSearch.toLowerCase()))
                    .map(wf => {
                      const isOnCanvas = canvasNodes.some(n => n.blockType === 'workflow' && n.refId === wf.id);
                      return (
                        <div
                          key={wf.id}
                          onClick={() => !isOnCanvas && addWorkflowToCanvas(wf)}
                          style={{
                            padding: '11px 14px', cursor: isOnCanvas ? 'default' : 'pointer',
                            borderBottom: '1px solid var(--border)', opacity: isOnCanvas ? 0.4 : 1,
                          }}
                          onMouseEnter={e => { if (!isOnCanvas) e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getCategoryColor(wf.category), flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{wf.name}</span>
                            {isOnCanvas && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ADDED</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 16 }}>{wf.category}</div>
                        </div>
                      );
                    })
                )
              ) : (
                NODE_PALETTE
                  .filter(cat => !nodeSearch || cat.nodes.some(n => n.toLowerCase().includes(nodeSearch.toLowerCase())) || cat.category.toLowerCase().includes(nodeSearch.toLowerCase()))
                  .map(cat => (
                    <div key={cat.category}>
                      <div
                        onClick={() => setExpandedNodeCats(prev => {
                          const next = new Set(prev);
                          next.has(cat.category) ? next.delete(cat.category) : next.add(cat.category);
                          return next;
                        })}
                        style={{
                          padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
                          cursor: 'pointer', background: 'var(--bg-panel)',
                          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-panel)'; }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em', flex: 1, color: 'var(--text-primary)' }}>{cat.category}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{expandedNodeCats.has(cat.category) ? '▲' : '▼'}</span>
                      </div>
                      {expandedNodeCats.has(cat.category) && cat.nodes
                        .filter(n => !nodeSearch || n.toLowerCase().includes(nodeSearch.toLowerCase()))
                        .map(nodeName => (
                          <div
                            key={nodeName}
                            onClick={() => addNodeToCanvas(nodeName, cat.category, cat.color)}
                            style={{
                              padding: '9px 14px 9px 30px', cursor: 'pointer',
                              borderBottom: '1px solid var(--border)', fontSize: 12,
                              color: 'var(--text-secondary)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tile-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <span style={{ marginRight: 8, fontSize: 10, color: cat.color }}>⊕</span>{nodeName}
                          </div>
                        ))
                      }
                    </div>
                  ))
              )}
            </div>

            {/* Niyanta output footer */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'rgba(124,58,237,0.08)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: '#7C3AED', display: 'grid', placeItems: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>N</div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#A78BFA' }}>Always ends with Niyanta</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Every agent reports output to Niyanta for oversight and cross-agent intelligence.
              </div>
            </div>
          </div>

          {/* ── Center: Canvas ───────────────────────────────────────────── */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {/* Canvas zoom controls */}
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              display: 'flex', gap: 4, background: 'var(--bg-panel)', border: '1px solid var(--border)',
              borderRadius: 6, padding: 4,
            }}>
              <button onClick={() => setCanvasZoom(z => Math.max(25, z - 10))} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
              }}>−</button>
              <span style={{ display: 'grid', placeItems: 'center', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', minWidth: 40, textAlign: 'center' }}>
                {canvasZoom}%
              </span>
              <button onClick={() => setCanvasZoom(z => Math.min(200, z + 10))} style={{
                width: 28, height: 28, borderRadius: 4, border: 'none',
                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16,
              }}>+</button>
            </div>

            <div
              ref={canvasRef}
              className="canvas-grid"
              style={{
                width: '100%', height: '100%', position: 'relative', cursor: wiringPreview ? 'crosshair' : panningCanvas.current ? 'grabbing' : 'grab',
                backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px`,
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}>
                <defs>
                  <marker id="agent-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                    <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" opacity="0.7" />
                  </marker>
                </defs>
                <g transform={`translate(${canvasPan.x}, ${canvasPan.y}) scale(${canvasZoom / 100})`}>
                  {/* Manual edges — click to delete */}
                  {agentEdges.map(edge => {
                    const from = getHandlePos(edge.from, 'right');
                    const to   = getHandlePos(edge.to,   'left');
                    const mx   = (from.x + to.x) / 2;
                    const d    = `M${from.x},${from.y} C${mx},${from.y} ${mx},${to.y} ${to.x},${to.y}`;
                    return (
                      <g key={edge.id}>
                        {/* invisible hit-area path */}
                        <path d={d} fill="none" stroke="transparent" strokeWidth={14}
                          pointerEvents="stroke" style={{ cursor: 'pointer' }}
                          onClick={() => deleteEdge(edge.id)} />
                        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.7}
                          markerEnd="url(#agent-arrow)" pointerEvents="none" />
                      </g>
                    );
                  })}
                  {/* Live wiring preview */}
                  {wiringFrom.current && wiringPreview && (() => {
                    const from = getHandlePos(wiringFrom.current!.nodeId, 'right');
                    const mx   = (from.x + wiringPreview.x) / 2;
                    return (
                      <path
                        d={`M${from.x},${from.y} C${mx},${from.y} ${mx},${wiringPreview.y} ${wiringPreview.x},${wiringPreview.y}`}
                        fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.5}
                        strokeDasharray="6 3" pointerEvents="none" />
                    );
                  })()}
                </g>
              </svg>

              {/* Nodes layer */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${canvasZoom / 100})`,
                transformOrigin: '0 0', zIndex: 2,
              }}>
                {/* ── Required INPUT node (Chat / Data) ── */}
                <div
                  onMouseDown={e => handleAnchorMouseDown(e, 'start')}
                  style={{
                    position: 'absolute', left: startNodePos.x, top: startNodePos.y,
                    width: 200, padding: '14px 16px',
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(0,212,255,0.1))',
                    border: '2px solid #3B82F6',
                    borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    userSelect: 'none', zIndex: 3, cursor: 'grab',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: '#3B82F6', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>▶</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#93C5FD' }}>INPUT</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CHAT / DATA</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>User message or file upload triggers this agent</div>
                  <div style={{ marginTop: 6, fontSize: 9, fontFamily: 'var(--font-mono)', color: '#93C5FD', textTransform: 'uppercase' }}>Required start node</div>
                  {/* Right handle */}
                  <div
                    title="Drag to connect"
                    onMouseDown={e => {
                      e.stopPropagation();
                      wiringFrom.current = { nodeId: '__start__' };
                      setWiringPreview(getHandlePos('__start__', 'right'));
                    }}
                    style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#3B82F6', border: '2px solid var(--bg-base)', cursor: 'crosshair', zIndex: 20 }} />
                </div>

                {/* ── Required OUTPUT node (Niyanta) ── */}
                <div
                  onMouseDown={e => handleAnchorMouseDown(e, 'end')}
                  style={{
                    position: 'absolute', left: endNodePos.x, top: endNodePos.y,
                    width: 200, padding: '14px 16px',
                    background: 'rgba(124,58,237,0.15)',
                    border: '2px solid #7C3AED',
                    borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                    userSelect: 'none', zIndex: 3, cursor: 'grab',
                  }}>
                  {/* Left handle */}
                  <div
                    title="Drop connection here"
                    onMouseUp={e => {
                      e.stopPropagation();
                      if (wiringFrom.current && wiringFrom.current.nodeId !== '__end__') {
                        const from = wiringFrom.current.nodeId;
                        setAgentEdges(prev => prev.some(ed => ed.from === from && ed.to === '__end__') ? prev : [...prev, { id: `e-${Date.now()}`, from, to: '__end__' }]);
                        setHasUnsavedAgentChanges(true);
                      }
                      wiringFrom.current = null;
                      setWiringPreview(null);
                    }}
                    style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#7C3AED', border: '2px solid var(--bg-base)', cursor: wiringPreview ? 'crosshair' : 'default', zIndex: 20 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: '#7C3AED', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>N</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA' }}>OUTPUT</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>NIYANTA REPORT</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>Results and insights reported to Niyanta</div>
                  <div style={{ marginTop: 6, fontSize: 9, fontFamily: 'var(--font-mono)', color: '#A78BFA', textTransform: 'uppercase' }}>Required end node</div>
                </div>

                {/* Pipeline Blocks (workflows + nodes) */}
                {canvasNodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute', left: node.x, top: node.y,
                      width: 240, padding: '12px',
                      background: selectedNode === node.id ? `${node.color}18` : 'var(--bg-panel)',
                      border: `2px solid ${selectedNode === node.id ? node.color : node.color + '88'}`,
                      borderRadius: 10,
                      boxShadow: selectedNode === node.id ? `0 0 18px ${node.color}40` : '0 4px 14px rgba(0,0,0,0.25)',
                      cursor: 'grab', userSelect: 'none',
                      zIndex: selectedNode === node.id ? 10 : 3,
                    }}
                    onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Left handle */}
                    {/* Left handle — accept incoming wire */}
                    <div
                      title="Drop connection here"
                      onMouseUp={e => {
                        e.stopPropagation();
                        if (wiringFrom.current && wiringFrom.current.nodeId !== node.id) {
                          const from = wiringFrom.current.nodeId;
                          setAgentEdges(prev => prev.some(ed => ed.from === from && ed.to === node.id) ? prev : [...prev, { id: `e-${Date.now()}`, from, to: node.id }]);
                          setHasUnsavedAgentChanges(true);
                        }
                        wiringFrom.current = null;
                        setWiringPreview(null);
                      }}
                      style={{ position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: node.color, border: '2px solid var(--bg-base)', cursor: wiringPreview ? 'crosshair' : 'default', zIndex: 20 }} />
                    {/* Right handle — start new wire */}
                    <div
                      title="Drag to connect"
                      onMouseDown={e => {
                        e.stopPropagation();
                        wiringFrom.current = { nodeId: node.id };
                        setWiringPreview(getHandlePos(node.id, 'right'));
                      }}
                      style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: node.color, border: '2px solid var(--bg-base)', cursor: 'crosshair', zIndex: 20 }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: node.color, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {node.blockType === 'workflow' ? '⚡' : '◆'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{node.blockType} · {node.category}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeNodeFromCanvas(node.id); }} style={{ width: 18, height: 18, borderRadius: 3, border: 'none', background: 'rgba(220,38,38,0.2)', color: '#ff6666', fontSize: 11, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>×</button>
                    </div>
                    <div
                      style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 6, paddingLeft: 2 }}>
                      INPUT INFO
                    </div>
                    <textarea
                      value={node.inputInfo}
                      onChange={e => {
                        setCanvasNodes(prev => prev.map(n => n.id === node.id ? { ...n, inputInfo: e.target.value } : n));
                        setHasUnsavedAgentChanges(true);
                      }}
                      onMouseDown={e => e.stopPropagation()}
                      placeholder="What data does this step need?"
                      rows={2}
                      style={{
                        width: '100%', padding: '5px 7px', fontSize: 10, resize: 'none',
                        background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                        borderRadius: 4, color: 'var(--text-secondary)', outline: 'none',
                        fontFamily: 'var(--font-body)', boxSizing: 'border-box',
                        cursor: 'text',
                      }}
                    />
                    <div style={{ padding: '3px 8px', borderRadius: 3, background: `${node.color}18`, fontSize: 9, fontFamily: 'var(--font-mono)', color: node.color, textAlign: 'center', marginTop: 6 }}>
                      {node.blockType === 'workflow' ? 'WORKFLOW BLOCK' : 'NODE BLOCK'}
                    </div>
                  </div>
                ))}

                {/* Empty canvas state */}
                {canvasNodes.length === 0 && (
                  <div style={{
                    position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
                    textAlign: 'center', color: 'var(--text-muted)', pointerEvents: 'none',
                  }}>
                    <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}>🤖</div>
                    <div style={{ fontSize: 14, marginBottom: 8 }}>Add Workflows to Define Agent Operations</div>
                    <div style={{ fontSize: 12, opacity: 0.6, maxWidth: 300 }}>
                      Click workflows from the left panel to add them as operational nodes. Connect them to define the agent's data processing pipeline.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Agent Config Panel ─────────────────────────────────── */}
          <div style={{
            width: 300, borderLeft: '1px solid var(--border)', background: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
              }}>AGENT CONFIGURATION</div>

              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={agentDescription}
                onChange={e => { setAgentDescription(e.target.value); setHasUnsavedAgentChanges(true); }}
                placeholder="What does this agent do?"
                rows={3}
                style={{
                  width: '100%', padding: '8px 10px', marginBottom: 14,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontSize: 12, color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                }}
              />

              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Capabilities
              </label>
              <textarea
                value={agentCapabilities}
                onChange={e => { setAgentCapabilities(e.target.value); setHasUnsavedAgentChanges(true); }}
                placeholder="e.g. OCR, validation, reporting"
                rows={2}
                style={{
                  width: '100%', padding: '8px 10px', marginBottom: 14,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontSize: 12, color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                }}
              />
            </div>

            {/* Agent behavior */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
              }}>BEHAVIOR</div>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer',
              }}>
                <input type="checkbox" checked={reportToNiyanta} onChange={e => { setReportToNiyanta(e.target.checked); setHasUnsavedAgentChanges(true); }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Report to Niyanta</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Send all processed data to Niyanta for oversight</div>
                </div>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer',
              }}>
                <input type="checkbox" checked={autoProcess} onChange={e => { setAutoProcess(e.target.checked); setHasUnsavedAgentChanges(true); }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Auto-Process Data</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Agent automatically processes incoming data through workflows</div>
                </div>
              </label>

              {/* Color picker */}
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Agent Color
              </label>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {['#00D4FF', '#059669', '#7C3AED', '#EC4899', '#F59E0B', '#EF4444', '#3B82F6', '#F97316'].map(c => (
                  <div
                    key={c}
                    onClick={() => { setAgentColor(c); setHasUnsavedAgentChanges(true); }}
                    style={{
                      width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer',
                      border: agentColor === c ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: agentColor === c ? `0 0 8px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Assigned workflows summary */}
            <div style={{ padding: '16px', flex: 1 }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12,
              }}>PIPELINE BLOCKS ({canvasNodes.length})</div>

              {canvasNodes.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No blocks added yet
                </div>
              ) : (
                canvasNodes.map(node => (
                  <div key={node.id} style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 6,
                    background: 'var(--bg-tile)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: node.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
                      <span style={{
                        fontSize: 9, padding: '2px 5px', borderRadius: 3,
                        background: node.blockType === 'workflow' ? 'rgba(59,130,246,0.2)' : 'rgba(124,58,237,0.2)',
                        color: node.blockType === 'workflow' ? '#93C5FD' : '#A78BFA',
                        fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase', flexShrink: 0,
                      }}>{node.blockType}</span>
                    </div>
                  </div>
                ))
              )}

              {/* Data flow diagram */}
              {canvasNodes.length > 0 && (
                <div style={{
                  marginTop: 16, padding: '12px', borderRadius: 6,
                  background: 'rgba(0, 212, 255, 0.06)', border: '1px solid rgba(0, 212, 255, 0.15)',
                }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginBottom: 8 }}>
                    DATA FLOW
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: 'var(--font-mono)' }}>
                    {(() => {
                      const adj: Record<string, string[]> = {};
                      for (const ed of agentEdges) { if (!adj[ed.from]) adj[ed.from] = []; adj[ed.from].push(ed.to); }
                      const visited = new Set<string>();
                      const order: typeof canvasNodes = [];
                      const queue = ['__start__'];
                      while (queue.length) {
                        const cur = queue.shift()!;
                        if (visited.has(cur)) continue;
                        visited.add(cur);
                        const n = canvasNodes.find(x => x.id === cur);
                        if (n) order.push(n);
                        for (const nxt of (adj[cur] || [])) queue.push(nxt);
                      }
                      for (const n of canvasNodes) if (!visited.has(n.id)) order.push(n);
                      return <>
                        INPUT (Chat / Data)<br />
                        {order.map(n => <React.Fragment key={n.id}>&nbsp;&nbsp;↓<br />{n.name}<br /></React.Fragment>)}
                        &nbsp;&nbsp;↓<br />
                        OUTPUT (Niyanta Report)
                      </>;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST VIEW — /agents (main grid with templates)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
        borderBottom: '1px solid var(--border)', background: 'var(--bg-dock)', flexShrink: 0,
      }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search agents..."
          style={{
            flex: 1, maxWidth: 400, height: 36, padding: '0 14px', fontSize: 13,
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
          }}
        />
        <button
          onClick={() => navigate('/agents/new')}
          style={{
            height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            color: 'var(--accent)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'var(--font-mono)', marginLeft: 'auto',
          }}
        >
          + CREATE
        </button>
        <button
          onClick={() => setShowTemplates(true)}
          style={{
            height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          TEMPLATES
        </button>
      </div>

      {/* ── Agent Grid ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filtered.length === 0 && !search ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 16 }}>🤖</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>No agents yet</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              <button onClick={() => navigate('/agents/new')} style={{
                height: 36, padding: '0 20px', borderRadius: 4,
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Create Your First Agent</button>
              <button onClick={() => setShowTemplates(true)} style={{
                height: 36, padding: '0 20px', borderRadius: 4,
                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.5)',
                color: '#7C3AED', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Browse Templates</button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gridAutoRows: '1fr',
            gap: 16,
          }}>
            {filtered.map(agent => {
              const state = agentStates[agent.id];
              const canDelete = !agent.isTemplate;
              const showMenu = openMenuId === agent.id;
              const statusColor = state?.status === 'complete' ? '#10B981'
                : state?.status === 'error' ? '#DC2626' : '#D97706';

              return (
                <div
                  key={agent.id}
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${agent.color}`,
                    borderRadius: 6,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = agent.color)}
                  onMouseLeave={e => {
                    (e.currentTarget.style as any).border = '1px solid var(--border)';
                    e.currentTarget.style.borderLeft = `3px solid ${agent.color}`;
                  }}
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest('.action-btn')) {
                      setDetailAgentId(agent.id);
                    }
                  }}
                >
                  {/* ── Header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.name}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600,
                      padding: '2px 5px', borderRadius: 3, letterSpacing: '0.04em',
                      background: agent.isDefault ? 'rgba(6,182,212,0.15)' : 'rgba(5,150,105,0.15)',
                      color: agent.isDefault ? '#06B6D4' : '#059669',
                      border: `1px solid ${agent.isDefault ? 'rgba(6,182,212,0.4)' : 'rgba(5,150,105,0.4)'}`,
                      flexShrink: 0,
                    }}>
                      {agent.isDefault ? 'DEFAULT' : 'CUSTOM'}
                    </span>

                    {/* Three-dot menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === agent.id ? null : agent.id); }}
                        style={{
                          width: 24, height: 24, borderRadius: 3, flexShrink: 0,
                          background: 'transparent', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        title="Options"
                      >⋮</button>

                      {showMenu && (
                        <div
                          className="action-btn"
                          style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: 4,
                            background: 'var(--bg-panel)', border: '1px solid var(--border)',
                            borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            zIndex: 200, minWidth: 148,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Edit */}
                          {!agent.isTemplate && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); setOpenMenuId(null);
                                navigate('/agents/new', { state: { editAgent: agent, editAgentId: agent.id } });
                              }}
                              style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tile-hover)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: 11 }}>✎</span> Edit
                            </button>
                          )}
                          {/* Rename */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); setOpenMenuId(null);
                              setRenamingAgent({ id: agent.id, name: agent.name });
                              setRenameValue(agent.name);
                            }}
                            style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tile-hover)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontSize: 11 }}>✎</span> Rename
                          </button>

                          {/* Maintenance */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); setOpenMenuId(null);
                              handleSetMaintenance(agent.id, agent.name);
                            }}
                            style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', borderTop: '1px solid var(--border)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)'; e.currentTarget.style.color = '#D97706'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                          >
                            <span style={{ fontSize: 11 }}>⚙</span> Maintenance
                          </button>

                          {/* Delete */}
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); setOpenMenuId(null);
                                handleDeleteAgent(agent.id, agent.name);
                              }}
                              style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', borderTop: '1px solid var(--border)' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#DC2626'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                            >
                              <span style={{ fontSize: 11 }}>✕</span> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Description (fills remaining space) ── */}
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  }}>
                    {agent.description || 'No description'}
                  </div>

                  {/* ── Footer ── */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 10, marginTop: 10, borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontSize: 10, color: agent.color, fontFamily: 'var(--font-mono)',
                      fontWeight: 600, textTransform: 'uppercase', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {agent.icon} {agent.subtitle}
                      {state && (
                        <span style={{ color: statusColor }}>
                          {' '}· {state.status}
                        </span>
                      )}
                    </div>
                    <button
                      className="action-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/agents/${agent.id}/run`); }}
                      style={{
                        height: 26, padding: '0 10px', borderRadius: 4, flexShrink: 0,
                        background: `${agent.color}18`, border: `1px solid ${agent.color}55`,
                        color: agent.color, cursor: 'pointer', fontSize: 10,
                        fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${agent.color}35`; e.currentTarget.style.borderColor = agent.color; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${agent.color}18`; e.currentTarget.style.borderColor = `${agent.color}55`; }}
                    >
                      ▶ RUN
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Agent Detail Panel ══════════════════════════════════════════════ */}
      {detailAgentId && (() => {
        const da = agents.find(a => a.id === detailAgentId);
        if (!da) return null;
        const ds = agentStates[da.id];
        const statusColor = ds?.status === 'complete' ? '#10B981' : ds?.status === 'error' ? '#DC2626' : ds?.status === 'processing' ? '#D97706' : 'var(--text-muted)';
        const canDeleteDetail = !da.isTemplate;

        return (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 300 }}
              onClick={() => setDetailAgentId(null)}
            />
            {/* Side panel */}
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
              background: 'var(--bg-panel)', borderLeft: `3px solid ${da.color}`,
              boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
              zIndex: 301, display: 'flex', flexDirection: 'column',
              overflowY: 'auto',
            }}>
              {/* Header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: `${da.color}22`,
                    border: `1.5px solid ${da.color}66`, display: 'grid', placeItems: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>{da.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, marginBottom: 3 }}>{da.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{da.subtitle}</div>
                  </div>
                  <button
                    onClick={() => setDetailAgentId(null)}
                    style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center', flexShrink: 0 }}
                  >×</button>
                </div>

                {/* Badges row */}
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600, padding: '2px 6px',
                    borderRadius: 3, letterSpacing: '0.05em',
                    background: da.isDefault ? 'rgba(6,182,212,0.15)' : 'rgba(5,150,105,0.15)',
                    color: da.isDefault ? '#06B6D4' : '#059669',
                    border: `1px solid ${da.isDefault ? 'rgba(6,182,212,0.4)' : 'rgba(5,150,105,0.4)'}`,
                  }}>{da.isDefault ? 'DEFAULT' : 'CUSTOM'}</span>
                  {ds && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600, padding: '2px 6px',
                      borderRadius: 3, letterSpacing: '0.05em', textTransform: 'uppercase',
                      background: ds.status === 'complete' ? 'rgba(16,185,129,0.12)' : ds.status === 'error' ? 'rgba(220,38,38,0.1)' : ds.status === 'processing' ? 'rgba(217,119,6,0.1)' : 'rgba(107,114,128,0.1)',
                      color: statusColor,
                      border: `1px solid ${statusColor === 'var(--text-muted)' ? 'var(--border)' : statusColor + '55'}`,
                    }}>{ds.status}</span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em', background: `${da.color}18`, color: da.color, border: `1px solid ${da.color}44` }}>
                    NIYANTA CONNECTED
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Description */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>Description</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{da.description || 'No description provided.'}</div>
                </div>

                {/* Capabilities */}
                {da.capabilities?.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>Capabilities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {da.capabilities.map((cap: string, i: number) => (
                        <span key={i} style={{ padding: '4px 8px', borderRadius: 3, fontSize: 10, background: `${da.color}12`, color: da.color, border: `1px solid ${da.color}30`, fontFamily: 'var(--font-mono)' }}>{cap}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Last activity */}
                {ds && (
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>Activity</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TASKS RUN</span>
                        <span style={{ fontWeight: 600 }}>{ds.taskCount ?? 0}</span>
                      </div>
                      {ds.lastActivity && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAST RUN</span>
                          <span>{new Date(ds.lastActivity).toLocaleString()}</span>
                        </div>
                      )}
                      {ds.processingTime != null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>LAST DURATION</span>
                          <span>{(ds.processingTime / 1000).toFixed(2)}s</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Linked workflows */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Linked Workflows {detailLinkedWorkflows.length > 0 && <span style={{ color: da.color }}>({detailLinkedWorkflows.length})</span>}
                  </div>
                  {detailLinkedWorkflows.length === 0 ? (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>No workflows linked</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {detailLinkedWorkflows.map(wf => (
                        <div key={wf.workflow_id} style={{ padding: '8px 10px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-tile)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: da.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</div>
                            {wf.category && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{wf.category}</div>}
                          </div>
                          {wf.can_trigger === 1 && (
                            <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '2px 5px', borderRadius: 3, border: '1px solid rgba(16,185,129,0.3)', flexShrink: 0 }}>TRIGGER</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agent flow */}
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>Execution Flow</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {['Input Received', 'Relevance Check', 'Workflow Conversion', 'Execute Pipeline', 'Report to Niyanta'].map((step, i, arr) => (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${da.color}20`, border: `1px solid ${da.color}55`, display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: da.color, flexShrink: 0 }}>{i + 1}</div>
                        <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                        {i < arr.length - 1 && <div style={{ flex: 1, height: 0, borderBottom: '1px dashed var(--border)' }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { setDetailAgentId(null); navigate(`/agents/${da.id}/run`); }}
                  style={{
                    flex: 1, height: 38, borderRadius: 4,
                    background: da.color, border: 'none',
                    color: '#fff', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.04em',
                  }}
                >▶ RUN AGENT</button>
                <button
                  onClick={() => {
                    setDetailAgentId(null);
                    navigate('/agents/new', { state: { editAgent: da, editAgentId: da.id } });
                  }}
                  style={{
                    height: 38, padding: '0 16px', borderRadius: 4,
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = da.color; e.currentTarget.style.color = da.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >EDIT</button>
                {canDeleteDetail && (
                  <button
                    onClick={() => { setDetailAgentId(null); handleDeleteAgent(da.id, da.name); }}
                    style={{
                      height: 38, padding: '0 16px', borderRadius: 4,
                      background: 'transparent', border: '1px solid #DC2626',
                      color: '#DC2626', cursor: 'pointer', fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >DELETE</button>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* ══ Template Gallery Modal ══════════════════════════════════════════ */}
      {showTemplates && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
          display: 'grid', placeItems: 'center',
        }} onClick={() => setShowTemplates(false)}>
          <div
            style={{
              background: 'var(--bg-panel)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 0, width: 800, maxWidth: '95vw', maxHeight: '85vh',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'linear-gradient(135deg, #00D4FF, #7C3AED)',
                display: 'grid', placeItems: 'center', color: '#fff', fontSize: 18,
              }}>🤖</div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, fontWeight: 600 }}>
                  AI Agent Templates
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Pre-configured agents with workflow pipelines — customize after creation
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowTemplates(false)} style={{
                width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18,
                display: 'grid', placeItems: 'center',
              }}>×</button>
            </div>

            {/* Templates */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {templateAgents.length === 0 ? (
                <div style={{
                  border: '1px dashed var(--border)', borderRadius: 8, padding: 24,
                  textAlign: 'center', color: 'var(--text-muted)', fontSize: 12,
                }}>
                  No agent templates available.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {templateAgents.map(template => (
                  <div
                    key={template.id}
                    style={{
                      background: 'var(--bg-tile)',
                      border: '1px solid var(--border)',
                      borderTop: `3px solid ${template.color}`,
                      borderRadius: 10,
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = template.color;
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.borderTopColor = template.color;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{template.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{template.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                      {template.description}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                      {template.capabilities.slice(0, 3).map((cap, i) => (
                        <span key={i} style={{
                          padding: '3px 6px', borderRadius: 3, fontSize: 9,
                          background: `${template.color}20`, color: template.color,
                          fontFamily: 'var(--font-mono)', fontWeight: 600,
                        }}>{cap}</span>
                      ))}
                      {template.capabilities.length > 3 && (
                        <span style={{
                          padding: '3px 6px', borderRadius: 3, fontSize: 9,
                          background: 'var(--bg-tile)', color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}>+{template.capabilities.length - 3}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                        fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                        background: template.isTemplate ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: template.isTemplate ? '#EF4444' : '#F59E0B',
                      }}>{template.isTemplate ? 'TEMPLATE' : 'DEFAULT'}</span>
                      <span style={{
                        padding: '3px 8px', borderRadius: 3, fontSize: 9,
                        background: 'rgba(0,212,255,0.12)', color: '#00D4FF',
                        fontFamily: 'var(--font-mono)', fontWeight: 600,
                      }}>{template.subtitle || 'General'}</span>
                    </div>

                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      borderTop: '1px solid var(--border)', paddingTop: 10,
                    }}>
                      Capabilities: {template.capabilities?.length || 0}
                    </div>

                    <button style={{
                      width: '100%', marginTop: 14, height: 34, borderRadius: 6,
                      background: `${template.color}20`, border: `1px solid ${template.color}60`,
                      color: template.color, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${template.color}35`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${template.color}20`; }}
                    >
                      USE TEMPLATE
                    </button>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ Rename Modal ═══════════════════════════════════════════════════ */}
      {renamingAgent && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'grid', placeItems: 'center' }}
          onClick={() => setRenamingAgent(null)}
        >
          <div
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: 24, width: 380, maxWidth: '90vw' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Rename Agent</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Enter a new name for this agent</div>
            <input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenamingAgent(null); }}
              autoFocus
              style={{
                width: '100%', height: 38, padding: '0 12px', borderRadius: 4,
                border: '1px solid var(--border)', background: 'var(--bg-input)',
                color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRenamingAgent(null)}
                style={{ height: 34, padding: '0 16px', borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
              >Cancel</button>
              <button
                onClick={handleRename}
                disabled={!renameValue.trim() || renameValue.trim() === renamingAgent.name}
                style={{ height: 34, padding: '0 16px', borderRadius: 4, border: '1px solid var(--accent-border)', background: 'var(--accent-dim)', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentConsole;
