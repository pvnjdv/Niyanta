import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { SAMPLES } from '../constants/samples';
import { NODE_GROUPS, NodeDefinition, getNodeColor, getNodeName, getNodeIcon } from '../constants/nodes';
import { WorkflowNodeInstance, WorkflowEdge } from '../types/workflow';
import { v4 as uuid } from 'uuid';

interface AgentConsoleProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
  runAllProgress: string | null;
  onRunAll: () => Promise<void>;
}

/* ─── Canvas Constants ─── */
const GRID_SIZE = 20;
const NODE_W = 200;
const NODE_H = 64;

/* ─── Helpers ─── */
function snap(v: number) { return Math.round(v / GRID_SIZE) * GRID_SIZE; }

function getEdgePath(from: WorkflowNodeInstance, to: WorkflowNodeInstance): string {
  const sx = from.position.x + NODE_W;
  const sy = from.position.y + NODE_H / 2;
  const ex = to.position.x;
  const ey = to.position.y + NODE_H / 2;
  const dx = Math.abs(ex - sx) * 0.5;
  return `M${sx},${sy} C${sx + dx},${sy} ${ex - dx},${ey} ${ex},${ey}`;
}

/* ─── Main Component ─── */
const AgentConsole: React.FC<AgentConsoleProps> = ({
  agents, agentStates, onExecuteAgent, runAllProgress, onRunAll,
}) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Agent list state
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Canvas state for selected agent
  const selectedId = agentId || null;
  const selectedAgent = selectedId ? agents.find(a => a.id === selectedId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;

  const [nodes, setNodes] = useState<WorkflowNodeInstance[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const [nodePaletteOpen, setNodePaletteOpen] = useState(true);
  const [inputText, setInputText] = useState('');

  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  // Load agent's backing workflow nodes (placeholder for now)
  useEffect(() => {
    if (selectedId) {
      // Default starter nodes for agents if none exist
      if (nodes.length === 0) {
        setNodes([
          { instanceId: uuid(), nodeType: 'manual_trigger', name: 'Trigger', config: {}, position: { x: 60, y: 160 } },
          { instanceId: uuid(), nodeType: 'llm_analysis', name: 'LLM Analysis', config: {}, position: { x: 340, y: 160 } },
          { instanceId: uuid(), nodeType: 'notification', name: 'Notify', config: {}, position: { x: 620, y: 160 } },
        ]);
        // Auto-connect after setting nodes
        setTimeout(() => {
          setNodes(prev => {
            if (prev.length >= 3) {
              setEdges([
                { id: uuid(), fromNodeId: prev[0].instanceId, toNodeId: prev[1].instanceId },
                { id: uuid(), fromNodeId: prev[1].instanceId, toNodeId: prev[2].instanceId },
              ]);
            }
            return prev;
          });
        }, 0);
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [selectedId]);

  // Node drag handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodes.find(n => n.instanceId === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
    setDragOffset({ x: e.clientX - node.position.x, y: e.clientY - node.position.y });
  }, [nodes]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    setNodes(prev => prev.map(n =>
      n.instanceId === draggingNodeId
        ? { ...n, position: { x: snap(e.clientX - dragOffset.x), y: snap(e.clientY - dragOffset.y) } }
        : n
    ));
  }, [draggingNodeId, dragOffset]);

  const handleCanvasMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);

  // Add node from palette
  const addNode = useCallback((def: NodeDefinition) => {
    const newNode: WorkflowNodeInstance = {
      instanceId: uuid(),
      nodeType: def.type,
      name: def.name,
      config: {},
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.instanceId);
  }, []);

  // Connect nodes
  const handleConnectorClick = useCallback((nodeId: string, isOutput: boolean) => {
    if (isOutput) {
      setConnecting(nodeId);
    } else if (connecting && connecting !== nodeId) {
      setEdges(prev => [...prev, { id: uuid(), fromNodeId: connecting, toNodeId: nodeId }]);
      setConnecting(null);
    }
  }, [connecting]);

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.instanceId !== nodeId));
    setEdges(prev => prev.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  // Run agent
  const handleRun = async () => {
    if (!selectedId) return;
    const input = inputText.trim() || SAMPLES[selectedId] || '';
    setInputText('');
    await onExecuteAgent(selectedId, input);
  };

  // Create agent
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        // TODO: refresh agent list from API
        window.location.reload();
      }
    } catch (err) {
      console.error('Create agent failed:', err);
    }
  };

  /* ─── Render ─── */

  // If no agent selected, show agent list
  if (!selectedId) {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, margin: 0 }}>
            Agent Studio
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 4,
              border: '1px solid var(--border)', background: 'var(--bg-tile)',
              color: 'var(--text-primary)', cursor: 'pointer',
              fontFamily: 'var(--font-mono)', fontSize: 12,
            }}
          >
            + New Agent
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents..."
          style={{
            width: '100%', maxWidth: 400, height: 36, padding: '0 12px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--text-primary)', marginBottom: 20, outline: 'none',
          }}
        />

        {/* Agent grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280, 1fr))', gap: 16 }}>
          {filtered.map(agent => {
            const state = agentStates[agent.id];
            return (
              <div
                key={agent.id}
                onClick={() => navigate(`/agents/${agent.id}`)}
                style={{
                  padding: 20,
                  background: 'var(--bg-tile)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'border-color 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 4,
                    background: agent.color || 'var(--bg-input)',
                    display: 'grid', placeItems: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                    color: '#fff',
                  }}>
                    {agent.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>
                      {agent.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                      {agent.subtitle}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {agent.description}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(agent.capabilities || []).map((cap, i) => (
                    <span key={i} style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px',
                      border: '1px solid var(--border)', borderRadius: 2,
                      color: 'var(--text-secondary)',
                    }}>
                      {cap}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                  Status: {state?.status || 'idle'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
            display: 'grid', placeItems: 'center',
          }} onClick={() => setShowCreate(false)}>
            <div
              style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border)',
                borderRadius: 4, padding: 24, width: 400, maxWidth: '90vw',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: '0 0 16px' }}>Create Agent</h3>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Agent name"
                style={{
                  width: '100%', height: 36, padding: '0 12px', marginBottom: 12,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Description"
                rows={3}
                style={{
                  width: '100%', padding: '8px 12px', marginBottom: 16,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    height: 36, padding: '0 16px', borderRadius: 4,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  style={{
                    height: 36, padding: '0 16px', borderRadius: 4,
                    border: '1px solid var(--border)', background: 'var(--bg-tile)',
                    color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Agent Studio view with canvas
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/agents')}
          style={{
            height: 32, padding: '0 10px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
          }}
        >
          ← Back
        </button>
        <div style={{
          width: 32, height: 32, borderRadius: 4,
          background: selectedAgent?.color || '#666',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: '#fff',
        }}>
          {selectedAgent?.icon}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600 }}>
            {selectedAgent?.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
            {selectedAgent?.subtitle}
          </div>
        </div>
        <div style={{ flex: 1 }} />

        {/* Input + Run */}
        <input
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRun(); }}
          placeholder="Input data (or use sample)..."
          style={{
            width: 300, height: 32, padding: '0 10px',
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--text-primary)', outline: 'none',
          }}
        />
        <button
          onClick={handleRun}
          disabled={selectedState?.status === 'processing'}
          style={{
            height: 32, padding: '0 16px', borderRadius: 4,
            border: '1px solid var(--border)',
            background: selectedState?.status === 'processing' ? 'var(--bg-tile)' : 'var(--accent-dim)',
            color: selectedState?.status === 'processing' ? 'var(--text-muted)' : 'var(--accent)',
            cursor: selectedState?.status === 'processing' ? 'wait' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          }}
        >
          {selectedState?.status === 'processing' ? 'Running...' : '▶ Run'}
        </button>
        <button
          onClick={() => setNodePaletteOpen(!nodePaletteOpen)}
          style={{
            height: 32, padding: '0 10px', borderRadius: 4,
            border: '1px solid var(--border)', background: nodePaletteOpen ? 'var(--accent-dim)' : 'transparent',
            color: nodePaletteOpen ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11,
          }}
        >
          Nodes
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            background: 'var(--bg-base)',
            backgroundImage: `radial-gradient(circle, var(--border) 1px, transparent 1px)`,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            cursor: draggingNodeId ? 'grabbing' : 'default',
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => { setSelectedNodeId(null); setConnecting(null); }}
        >
          {/* Edges */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.instanceId === edge.fromNodeId);
              const toNode = nodes.find(n => n.instanceId === edge.toNodeId);
              if (!fromNode || !toNode) return null;
              return (
                <path
                  key={edge.id}
                  d={getEdgePath(fromNode, toNode)}
                  stroke="var(--text-muted)"
                  strokeWidth={2}
                  fill="none"
                  strokeDasharray={connecting ? '4,4' : 'none'}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const isSelected = selectedNodeId === node.instanceId;
            const isConnecting = connecting === node.instanceId;
            return (
              <div
                key={node.instanceId}
                style={{
                  position: 'absolute',
                  left: node.position.x,
                  top: node.position.y,
                  width: NODE_W,
                  height: NODE_H,
                  background: 'var(--bg-panel)',
                  border: `1px solid ${isSelected ? 'var(--accent)' : isConnecting ? 'var(--text-secondary)' : 'var(--border)'}`,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  gap: 10,
                  cursor: 'grab',
                  userSelect: 'none',
                  zIndex: isSelected ? 10 : 1,
                  boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.instanceId)}
                onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.instanceId); }}
              >
                {/* Input connector */}
                <div
                  style={{
                    position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--bg-panel)', border: '2px solid var(--border)',
                    cursor: 'pointer', zIndex: 20,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleConnectorClick(node.instanceId, false); }}
                />

                {/* Node content */}
                <span style={{ fontSize: 16 }}>{getNodeIcon(node.nodeType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {node.name}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)',
                  }}>
                    {node.nodeType}
                  </div>
                </div>

                {/* Delete button */}
                {isSelected && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.instanceId); }}
                    style={{
                      position: 'absolute', top: -8, right: -8,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--status-danger)', color: '#fff',
                      border: 'none', cursor: 'pointer', fontSize: 10,
                      display: 'grid', placeItems: 'center', zIndex: 20,
                    }}
                  >
                    ✕
                  </button>
                )}

                {/* Output connector */}
                <div
                  style={{
                    position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 12, height: 12, borderRadius: '50%',
                    background: connecting === node.instanceId ? 'var(--accent)' : 'var(--bg-panel)',
                    border: `2px solid ${connecting === node.instanceId ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer', zIndex: 20,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleConnectorClick(node.instanceId, true); }}
                />
              </div>
            );
          })}
        </div>

        {/* Node Palette — right side */}
        {nodePaletteOpen && (
          <div style={{
            width: 240, borderLeft: '1px solid var(--border)',
            background: 'var(--bg-panel)', overflowY: 'auto',
            flexShrink: 0,
          }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Node Palette
            </div>
            {NODE_GROUPS.map(group => (
              <div key={group.id}>
                <div style={{
                  padding: '10px 16px 4px', fontFamily: 'var(--font-mono)',
                  fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {group.icon} {group.name}
                </div>
                {group.nodes.map(node => (
                  <button
                    key={node.type}
                    onClick={() => addNode(node)}
                    style={{
                      width: '100%', height: 36, padding: '0 16px',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    title={node.description}
                  >
                    <span style={{ fontSize: 14 }}>{node.icon}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.name}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Execution result panel — bottom overlay */}
        {selectedState?.result && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: nodePaletteOpen ? 240 : 0,
            maxHeight: 200, overflowY: 'auto',
            background: 'var(--bg-panel)', borderTop: '1px solid var(--border)',
            padding: 16,
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
              textTransform: 'uppercase', marginBottom: 8,
            }}>
              Last Execution Result
              {selectedState.processingTime && (
                <span style={{ marginLeft: 8 }}>{selectedState.processingTime}ms</span>
              )}
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
              maxHeight: 140, overflow: 'auto',
            }}>
              {JSON.stringify(selectedState.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentConsole;
