import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { SAMPLES } from '../constants/samples';

// ── Agent Templates ──────────────────────────────────────────────────────────
const AGENT_TEMPLATES = [
  {
    id: 'tpl-finance',
    name: 'Finance Operations Agent',
    description: 'End-to-end finance automation — invoice processing, payment validation, expense tracking, and financial reporting. Connects to finance workflows and reports anomalies to Niyanta.',
    icon: '💰',
    color: '#10B981',
    category: 'Finance',
    capabilities: ['Invoice Processing', 'Payment Validation', 'Expense Tracking', 'Financial Reporting', 'Anomaly Detection'],
    defaultWorkflows: ['Invoice-to-Payment', 'Expense Approval', 'Budget Monitoring'],
    complexity: 'advanced' as const,
  },
  {
    id: 'tpl-hr',
    name: 'HR & People Ops Agent',
    description: 'Manages employee onboarding, leave requests, performance reviews, and compliance checks. Processes HR documents and escalates issues to Niyanta for oversight.',
    icon: '👥',
    color: '#8B5CF6',
    category: 'HR',
    capabilities: ['Onboarding Automation', 'Leave Management', 'Document Verification', 'Compliance Checking', 'Performance Tracking'],
    defaultWorkflows: ['Employee Onboarding', 'Leave Approval', 'Document Classification'],
    complexity: 'intermediate' as const,
  },
  {
    id: 'tpl-security',
    name: 'Security & Compliance Agent',
    description: 'Monitors security events, enforces compliance policies, performs risk assessments, and generates audit reports. All findings are reported to Niyanta in real-time.',
    icon: '🛡️',
    color: '#EF4444',
    category: 'Security',
    capabilities: ['Threat Monitoring', 'Policy Enforcement', 'Risk Assessment', 'Audit Reporting', 'Access Control'],
    defaultWorkflows: ['Security Scan', 'Compliance Check', 'Incident Response'],
    complexity: 'advanced' as const,
  },
];

interface AgentConsoleProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
  runAllProgress: string | null;
  onRunAll: () => Promise<void>;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({
  agents, agentStates, onExecuteAgent, runAllProgress, onRunAll,
}) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [inputText, setInputText] = useState('');
  const [linkedWorkflows, setLinkedWorkflows] = useState<Array<{workflow_id: string; name: string; description: string; category: string; can_trigger: number}>>([]);

  // Canvas state (for /agents/new or editing)
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentCapabilities, setAgentCapabilities] = useState('');
  const [agentColor, setAgentColor] = useState('#00D4FF');
  const [reportToNiyanta, setReportToNiyanta] = useState(true);
  const [autoProcess, setAutoProcess] = useState(true);
  const [availableWorkflows, setAvailableWorkflows] = useState<Array<{id: string; name: string; description: string; category: string; status?: string}>>([]);
  const [canvasNodes, setCanvasNodes] = useState<Array<{
    id: string; workflowId: string; name: string; category: string;
    x: number; y: number; role: 'input' | 'process' | 'output';
  }>>([]);
  const [edges, setEdges] = useState<Array<{id: string; source: string; target: string}>>([]);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingNode = useRef<{ nodeId: string; startX: number; startY: number; originX: number; originY: number } | null>(null);
  const panningCanvas = useRef<{ startX: number; startY: number; originPanX: number; originPanY: number } | null>(null);

  const selectedAgent = agentId && agentId !== 'new' ? agents.find(a => a.id === agentId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;
  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  // ── Fetch workflows ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/workflow');
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
        const res = await fetch(`http://localhost:3001/api/agent/${agentId}/workflows`);
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

  // ── Canvas helpers ─────────────────────────────────────────────────────────
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Finance': '#10B981', 'HR': '#EC4899', 'Operations': '#3B82F6',
      'Security': '#EF4444', 'Compliance': '#F59E0B', 'IT': '#8B5CF6',
      'Document Processing': '#06B6D4', 'General': '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const getRoleColor = (role: string) => {
    return role === 'input' ? '#3B82F6' : role === 'process' ? '#F59E0B' : '#10B981';
  };

  const addWorkflowToCanvas = (workflow: {id: string; name: string; category: string}) => {
    if (canvasNodes.find(n => n.workflowId === workflow.id)) return;
    const baseX = 200 + (canvasNodes.length % 3) * 280;
    const baseY = 150 + Math.floor(canvasNodes.length / 3) * 180;
    setCanvasNodes(prev => [...prev, {
      id: `wn-${Date.now()}`,
      workflowId: workflow.id,
      name: workflow.name,
      category: workflow.category,
      x: baseX, y: baseY,
      role: canvasNodes.length === 0 ? 'input' : 'process',
    }]);
  };

  const removeNodeFromCanvas = (nodeId: string) => {
    setCanvasNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  };

  const handleSaveAgent = async () => {
    if (!agentName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:3001/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName.trim(),
          description: agentDescription.trim(),
          capabilities: agentCapabilities.trim(),
          workflows: canvasNodes.map(n => n.workflowId),
          config: {
            reportToNiyanta,
            autoProcess,
            canvasLayout: canvasNodes.map(n => ({ workflowId: n.workflowId, x: n.x, y: n.y, role: n.role })),
            edges: edges.map(e => ({ source: e.source, target: e.target })),
          },
        }),
      });
      if (res.ok) {
        setLastSaved(new Date());
        setTimeout(() => navigate('/agents'), 500);
      }
    } catch (err) {
      console.error('Failed to save agent:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseTemplate = async (template: typeof AGENT_TEMPLATES[0]) => {
    setAgentName(template.name);
    setAgentDescription(template.description);
    setAgentCapabilities(template.capabilities.join(', '));
    setAgentColor(template.color);

    // Auto-add matching workflows to canvas
    const matching = availableWorkflows.filter(wf =>
      wf.category === template.category ||
      template.defaultWorkflows.some(dw => wf.name.toLowerCase().includes(dw.toLowerCase()))
    );
    const nodes = matching.map((wf, i) => ({
      id: `wn-${Date.now()}-${i}`,
      workflowId: wf.id,
      name: wf.name,
      category: wf.category,
      x: 200 + (i % 3) * 280,
      y: 150 + Math.floor(i / 3) * 180,
      role: (i === 0 ? 'input' : i === matching.length - 1 ? 'output' : 'process') as 'input' | 'process' | 'output',
    }));
    setCanvasNodes(nodes);

    // Auto-create edges sequentially
    const newEdges = nodes.slice(0, -1).map((n, i) => ({
      id: `edge-${Date.now()}-${i}`,
      source: n.id,
      target: nodes[i + 1].id,
    }));
    setEdges(newEdges);

    setShowTemplates(false);
    navigate('/agents/new');
  };

  // ── Canvas mouse handlers ──────────────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
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

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode.current) {
      const { nodeId, startX, startY, originX, originY } = draggingNode.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const scale = canvasZoom / 100;
      setCanvasNodes(prev => prev.map(n =>
        n.id === nodeId
          ? { ...n, x: originX + dx / scale, y: originY + dy / scale }
          : n
      ));
    }
    if (panningCanvas.current) {
      setCanvasPan({
        x: panningCanvas.current.originPanX + (e.clientX - panningCanvas.current.startX),
        y: panningCanvas.current.originPanY + (e.clientY - panningCanvas.current.startY),
      });
    }
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setMousePos({ x: (e.clientX - rect.left - canvasPan.x) / (canvasZoom / 100), y: (e.clientY - rect.top - canvasPan.y) / (canvasZoom / 100) });
      }
    }
  }, [canvasZoom, canvasPan, connectingFrom]);

  const handleCanvasMouseUp = () => {
    draggingNode.current = null;
    panningCanvas.current = null;
    setConnectingFrom(null);
  };

  const handleOutputClick = (nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      if (!edges.find(e => e.source === connectingFrom && e.target === nodeId)) {
        setEdges(prev => [...prev, { id: `edge-${Date.now()}`, source: connectingFrom, target: nodeId }]);
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  };

  const handleRun = async () => {
    if (!agentId || agentId === 'new') return;
    const input = inputText.trim() || SAMPLES[agentId] || '';
    setInputText('');
    await onExecuteAgent(agentId, input);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CANVAS VIEW — /agents/new (create)
  // ══════════════════════════════════════════════════════════════════════════
  if (agentId === 'new') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {/* ── Top Toolbar ────────────────────────────────────────────────── */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          borderBottom: '1px solid var(--border)', background: 'var(--bg-dock)', flexShrink: 0,
        }}>
          <button onClick={() => navigate('/agents')} style={{
            height: 36, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
          }}>← Back</button>

          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

          <input
            value={agentName}
            onChange={e => setAgentName(e.target.value)}
            placeholder="Agent Name..."
            style={{
              width: 260, height: 36, padding: '0 14px', fontSize: 14, fontWeight: 600,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--text-primary)', outline: 'none',
            }}
          />

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

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            {lastSaved && <span>Saved {lastSaved.toLocaleTimeString()}</span>}
          </div>

          <button onClick={handleSaveAgent} disabled={!agentName.trim() || isSaving} style={{
            height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            background: agentName.trim() ? 'var(--accent-dim)' : 'var(--bg-tile)',
            border: '1px solid var(--accent-border)',
            color: agentName.trim() ? 'var(--accent)' : 'var(--text-muted)',
            cursor: agentName.trim() ? 'pointer' : 'not-allowed',
          }}>{isSaving ? 'SAVING...' : 'SAVE AGENT'}</button>
        </div>

        {/* ── Main Area ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left: Workflow Palette ────────────────────────────────────── */}
          <div style={{
            width: 280, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
              }}>WORKFLOW NODES</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                Click workflows to add them as operational nodes on the canvas
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {availableWorkflows.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                  No workflows available.<br />Create workflows first in Workflow Studio.
                </div>
              ) : (
                availableWorkflows.map(wf => {
                  const isOnCanvas = canvasNodes.some(n => n.workflowId === wf.id);
                  return (
                    <div
                      key={wf.id}
                      onClick={() => !isOnCanvas && addWorkflowToCanvas(wf)}
                      style={{
                        padding: '12px 16px', cursor: isOnCanvas ? 'default' : 'pointer',
                        borderBottom: '1px solid var(--border)',
                        opacity: isOnCanvas ? 0.4 : 1,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isOnCanvas) e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: getCategoryColor(wf.category),
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{wf.name}</span>
                        {isOnCanvas && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ADDED</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 18 }}>
                        {wf.category}{wf.description ? ` · ${wf.description}` : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Niyanta reporting node (always present) */}
            <div style={{
              padding: '14px 16px', borderTop: '1px solid var(--border)',
              background: 'rgba(139, 92, 246, 0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6, background: '#8B5CF6',
                  display: 'grid', placeItems: 'center', fontSize: 12, color: '#fff', fontWeight: 700,
                }}>N</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA' }}>Niyanta Orchestrator</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                All data processed by this agent is automatically reported to Niyanta for oversight, analytics, and cross-agent intelligence.
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
                width: '100%', height: '100%', position: 'relative', cursor: panningCanvas.current ? 'grabbing' : 'grab',
                backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: `${canvasPan.x}px ${canvasPan.y}px`,
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            >
              <svg style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                pointerEvents: 'none', zIndex: 1,
              }}>
                <g transform={`translate(${canvasPan.x}, ${canvasPan.y}) scale(${canvasZoom / 100})`}>
                  {/* Edges */}
                  {edges.map(edge => {
                    const src = canvasNodes.find(n => n.id === edge.source);
                    const tgt = canvasNodes.find(n => n.id === edge.target);
                    if (!src || !tgt) return null;
                    const sx = src.x + 240, sy = src.y + 50;
                    const tx = tgt.x, ty = tgt.y + 50;
                    const mx = (sx + tx) / 2;
                    return (
                      <g key={edge.id}>
                        <path d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`}
                          fill="none" stroke="var(--accent)" strokeWidth={2} opacity={0.6} />
                        <circle cx={tx} cy={ty} r={4} fill="var(--accent)" opacity={0.8} />
                      </g>
                    );
                  })}

                  {/* Connecting line */}
                  {connectingFrom && (() => {
                    const src = canvasNodes.find(n => n.id === connectingFrom);
                    if (!src) return null;
                    const sx = src.x + 240, sy = src.y + 50;
                    return (
                      <path d={`M${sx},${sy} L${mousePos.x},${mousePos.y}`}
                        fill="none" stroke="var(--accent)" strokeWidth={2} strokeDasharray="6,4" opacity={0.5} />
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
                {/* Agent Core Node (always visible) */}
                <div style={{
                  position: 'absolute', left: 60, top: 80,
                  width: 220, padding: '16px',
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(139,92,246,0.15))',
                  border: `2px solid ${agentColor}`,
                  borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: agentColor,
                      display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 14,
                    }}>AI</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{agentName || 'New AI Agent'}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ORCHESTRATOR</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {canvasNodes.length} workflow{canvasNodes.length !== 1 ? 's' : ''} assigned · {reportToNiyanta ? 'Reports to Niyanta' : 'Standalone'}
                  </div>
                  {/* Output handle */}
                  <div style={{
                    position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                    width: 16, height: 16, borderRadius: '50%', background: '#00D4FF',
                    border: '2px solid var(--bg-base)', cursor: 'crosshair',
                  }} />
                </div>

                {/* Niyanta Report Node (bottom) */}
                {reportToNiyanta && (
                  <div style={{
                    position: 'absolute', left: 60, top: 400,
                    width: 220, padding: '14px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '2px solid #8B5CF6',
                    borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    userSelect: 'none',
                  }}>
                    {/* Input handle */}
                    <div style={{
                      position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                      width: 16, height: 16, borderRadius: '50%', background: '#8B5CF6',
                      border: '2px solid var(--bg-base)',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, background: '#8B5CF6',
                        display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: 13,
                      }}>N</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>Niyanta Report</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DATA SINK</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                      Receives processed data, anomalies & insights for cross-agent intelligence
                    </div>
                  </div>
                )}

                {/* Workflow Nodes */}
                {canvasNodes.map(node => (
                  <div
                    key={node.id}
                    style={{
                      position: 'absolute', left: node.x, top: node.y,
                      width: 240, padding: '14px',
                      background: selectedNode === node.id
                        ? 'rgba(0, 212, 255, 0.12)'
                        : 'var(--bg-panel)',
                      border: `2px solid ${selectedNode === node.id ? 'var(--accent)' : getCategoryColor(node.category)}`,
                      borderRadius: 10,
                      boxShadow: selectedNode === node.id
                        ? '0 0 20px rgba(0, 212, 255, 0.2)'
                        : '0 4px 16px rgba(0,0,0,0.3)',
                      cursor: 'grab',
                      userSelect: 'none',
                      zIndex: selectedNode === node.id ? 10 : 3,
                    }}
                    onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Input handle */}
                    <div
                      onClick={e => { e.stopPropagation(); handleOutputClick(node.id); }}
                      style={{
                        position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
                        width: 16, height: 16, borderRadius: '50%',
                        background: connectingFrom ? '#00D4FF' : getCategoryColor(node.category),
                        border: '2px solid var(--bg-base)', cursor: 'crosshair',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.3)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(-50%)')}
                    />

                    {/* Output handle */}
                    <div
                      onClick={e => { e.stopPropagation(); handleOutputClick(node.id); }}
                      style={{
                        position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
                        width: 16, height: 16, borderRadius: '50%',
                        background: getCategoryColor(node.category),
                        border: '2px solid var(--bg-base)', cursor: 'crosshair',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-50%) scale(1.3)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(-50%)')}
                    />

                    {/* Node content */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: getCategoryColor(node.category),
                        display: 'grid', placeItems: 'center', color: '#fff',
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>⚡</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {node.name}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {node.category.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); removeNodeFromCanvas(node.id); }}
                        style={{
                          width: 20, height: 20, borderRadius: 4, border: 'none',
                          background: 'rgba(255,68,68,0.2)', color: '#ff6666', fontSize: 12,
                          cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
                        }}
                      >×</button>
                    </div>

                    {/* Role selector */}
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['input', 'process', 'output'] as const).map(role => (
                        <button
                          key={role}
                          onClick={e => {
                            e.stopPropagation();
                            setCanvasNodes(prev => prev.map(n => n.id === node.id ? { ...n, role } : n));
                          }}
                          style={{
                            flex: 1, padding: '3px 0', borderRadius: 3, fontSize: 9,
                            fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600,
                            cursor: 'pointer',
                            background: node.role === role ? getRoleColor(role) : 'var(--bg-tile)',
                            color: node.role === role ? '#fff' : 'var(--text-muted)',
                            border: node.role === role ? 'none' : '1px solid var(--border)',
                          }}
                        >{role}</button>
                      ))}
                    </div>

                    {/* Data flow indicator */}
                    <div style={{
                      marginTop: 8, padding: '4px 8px', borderRadius: 3,
                      background: 'rgba(0, 212, 255, 0.08)', fontSize: 9,
                      fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                    }}>
                      DATA → AGENT PROCESS → NIYANTA
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
                onChange={e => setAgentDescription(e.target.value)}
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
                onChange={e => setAgentCapabilities(e.target.value)}
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
                <input type="checkbox" checked={reportToNiyanta} onChange={e => setReportToNiyanta(e.target.checked)} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>Report to Niyanta</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Send all processed data to Niyanta for oversight</div>
                </div>
              </label>

              <label style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer',
              }}>
                <input type="checkbox" checked={autoProcess} onChange={e => setAutoProcess(e.target.checked)} />
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
                {['#00D4FF', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#3B82F6', '#F97316'].map(c => (
                  <div
                    key={c}
                    onClick={() => setAgentColor(c)}
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
              }}>ASSIGNED WORKFLOWS ({canvasNodes.length})</div>

              {canvasNodes.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No workflows assigned yet
                </div>
              ) : (
                canvasNodes.map(node => (
                  <div key={node.id} style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 6,
                    background: 'var(--bg-tile)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: getCategoryColor(node.category) }} />
                      <span style={{ fontSize: 11, fontWeight: 500, flex: 1 }}>{node.name}</span>
                      <span style={{
                        fontSize: 9, padding: '2px 6px', borderRadius: 3,
                        background: getRoleColor(node.role), color: '#fff',
                        fontFamily: 'var(--font-mono)', fontWeight: 600, textTransform: 'uppercase',
                      }}>{node.role}</span>
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
                    {canvasNodes.filter(n => n.role === 'input').map(n => n.name).join(', ') || 'Input'}<br />
                    &nbsp;&nbsp;↓ Data ingestion<br />
                    {agentName || 'Agent'} (AI Processing)<br />
                    &nbsp;&nbsp;↓ Workflows execute<br />
                    {canvasNodes.filter(n => n.role === 'output').map(n => n.name).join(', ') || 'Output'}<br />
                    {reportToNiyanta && <>&nbsp;&nbsp;↓ Report results<br />Niyanta Intelligence</>}
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
  // INDIVIDUAL AGENT VIEW — /agents/:agentId (chat / detail)
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedAgent) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-dock)',
        }}>
          <button onClick={() => navigate('/agents')} style={{
            height: 36, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
          }}>← Back</button>

          <div style={{
            width: 40, height: 40, borderRadius: 8, background: selectedAgent.color,
            display: 'grid', placeItems: 'center', color: '#fff',
            fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
            boxShadow: `0 4px 12px ${selectedAgent.glow}`,
          }}>{selectedAgent.icon}</div>

          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>{selectedAgent.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{selectedAgent.subtitle}</div>
          </div>

          <div style={{ flex: 1 }} />

          <input
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
            placeholder="Type your message..."
            style={{
              width: 350, height: 40, padding: '0 14px',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button onClick={handleRun} disabled={selectedState?.status === 'processing'} style={{
            height: 40, padding: '0 20px', borderRadius: 4, fontWeight: 600,
            border: '1px solid var(--accent-border)',
            background: selectedState?.status === 'processing' ? 'var(--bg-tile)' : 'var(--accent-dim)',
            color: selectedState?.status === 'processing' ? 'var(--text-muted)' : 'var(--accent)',
            cursor: selectedState?.status === 'processing' ? 'wait' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12,
          }}>{selectedState?.status === 'processing' ? 'PROCESSING...' : 'SEND'}</button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Chat Area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {selectedState?.result ? (
                <div style={{
                  background: 'var(--bg-panel)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 20,
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                    textTransform: 'uppercase', marginBottom: 12,
                  }}>
                    AGENT RESPONSE
                    {selectedState.processingTime && <span style={{ marginLeft: 8 }}>· {selectedState.processingTime}ms</span>}
                  </div>
                  <pre style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6,
                  }}>
                    {typeof selectedState.result === 'string' ? selectedState.result : JSON.stringify(selectedState.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Send a message to {selectedAgent.name}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Linked Workflows */}
          <div style={{
            width: 320, borderLeft: '1px solid var(--border)', background: 'var(--bg-panel)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(0, 212, 255, 0.05)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em',
              }}>LINKED WORKFLOWS</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Workflows this agent can execute
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {linkedWorkflows.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                  No workflows linked yet.<br />Edit agent to add workflows.
                </div>
              ) : (
                linkedWorkflows.map(wf => (
                  <div key={wf.workflow_id} style={{
                    padding: '16px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => window.open('/workflows', '_blank')}
                  >
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>
                      {wf.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
                      {wf.category} · {wf.description || 'No description'}
                    </div>
                    <div style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 3,
                      background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88',
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                    }}>CAN EXECUTE</div>
                  </div>
                ))
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
                background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.4)',
                color: '#8B5CF6', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>Browse Templates</button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(agent => {
              const state = agentStates[agent.id];
              return (
                <div
                  key={agent.id}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                  style={{
                    background: 'var(--bg-panel)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${agent.color}`,
                    borderRadius: 8,
                    padding: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = agent.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 8px 24px ${agent.glow}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.borderLeftColor = agent.color;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 8, background: agent.color,
                      display: 'grid', placeItems: 'center', color: '#fff',
                      fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
                      boxShadow: `0 4px 12px ${agent.glow}`,
                    }}>{agent.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{agent.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{agent.subtitle}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                    {agent.description || 'No description'}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {agent.capabilities.slice(0, 3).map((cap, i) => (
                      <span key={i} style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 10,
                        background: 'var(--bg-tile)', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                      }}>{cap}</span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 10,
                        background: 'var(--bg-tile)', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>+{agent.capabilities.length - 3}</span>
                    )}
                  </div>

                  {state && (
                    <div style={{
                      padding: '8px 12px', borderRadius: 4, fontSize: 11,
                      background: state.status === 'complete' ? 'rgba(0, 255, 136, 0.1)' :
                                 state.status === 'error' ? 'rgba(255, 68, 68, 0.1)' :
                                 'rgba(255, 165, 0, 0.1)',
                      color: state.status === 'complete' ? '#00ff88' :
                             state.status === 'error' ? '#ff4444' : '#ffa500',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {state.status.toUpperCase()}
                      {state.processingTime && ` · ${state.processingTime}ms`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                background: 'linear-gradient(135deg, #00D4FF, #8B5CF6)',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {AGENT_TEMPLATES.map(template => (
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
                        background: template.complexity === 'advanced' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                        color: template.complexity === 'advanced' ? '#EF4444' : '#F59E0B',
                      }}>{template.complexity}</span>
                      <span style={{
                        padding: '3px 8px', borderRadius: 3, fontSize: 9,
                        background: 'rgba(0,212,255,0.12)', color: '#00D4FF',
                        fontFamily: 'var(--font-mono)', fontWeight: 600,
                      }}>{template.category}</span>
                    </div>

                    <div style={{
                      fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      borderTop: '1px solid var(--border)', paddingTop: 10,
                    }}>
                      Default workflows:
                      {template.defaultWorkflows.map((wf, i) => (
                        <div key={i} style={{ marginTop: 4, paddingLeft: 8 }}>· {wf}</div>
                      ))}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentConsole;
