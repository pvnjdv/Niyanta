import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GlassCard, GlassPanel, GlassButton, GlassBadge, GlassInput } from '../components/shared/GlassCard';
import StatusDot from '../components/shared/StatusDot';

interface WorkflowStudioProps {
  workflows: Array<{ id?: string; name?: string; status?: string; description?: string; category?: string }>;
  onSaveWorkflow: (nodes: any[], edges: any[]) => Promise<void>;
}

const WorkflowStudio: React.FC<WorkflowStudioProps> = ({ workflows, onSaveWorkflow }) => {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const filterTabs = ['ALL', 'ACTIVE', 'DRAFT', 'DISABLED', 'FAILED'];

  const mockWorkflows = [
    { id: 'wf-1', name: 'Invoice-to-Payment Automation', status: 'ACTIVE', category: 'Finance', nodes: 14, runs: 50, success: 94, avgTime: '2.3hr', agents: [{ name: 'Invoice', color: '#FFB800' }, { name: 'Compliance', color: '#A78BFA' }] },
    { id: 'wf-2', name: 'Employee Onboarding Flow', status: 'ACTIVE', category: 'HR', nodes: 8, runs: 28, success: 97, avgTime: '1.5hr', agents: [{ name: 'HR', color: '#00E676' }, { name: 'IT', color: '#F472B6' }] },
    { id: 'wf-3', name: 'Procurement Approval Chain', status: 'ACTIVE', category: 'Operations', nodes: 6, runs: 15, success: 100, avgTime: '0.8hr', agents: [{ name: 'Procurement', color: '#FF6B6B' }] },
    { id: 'wf-4', name: 'Security Incident Response', status: 'ACTIVE', category: 'Security', nodes: 11, runs: 7, success: 86, avgTime: '0.4hr', agents: [{ name: 'Security', color: '#FF4488' }, { name: 'IT', color: '#F472B6' }] },
    { id: 'wf-5', name: 'Compliance Audit Pipeline', status: 'DRAFT', category: 'Compliance', nodes: 9, runs: 0, success: 0, avgTime: '—', agents: [{ name: 'Compliance', color: '#A78BFA' }] },
    { id: 'wf-6', name: 'Meeting Action Tracker', status: 'ACTIVE', category: 'Productivity', nodes: 5, runs: 34, success: 98, avgTime: '0.3hr', agents: [{ name: 'Meeting', color: '#00D4FF' }] },
    { id: 'wf-7', name: 'IT Access Provisioning', status: 'DRAFT', category: 'IT', nodes: 7, runs: 0, success: 0, avgTime: '—', agents: [{ name: 'IT', color: '#F472B6' }] },
    { id: 'wf-8', name: 'Document Classification Flow', status: 'ACTIVE', category: 'Document', nodes: 4, runs: 89, success: 96, avgTime: '0.2hr', agents: [{ name: 'Document', color: '#F59E0B' }] },
  ];

  const templates = [
    'Invoice Automation', 'Employee Onboarding', 'Procurement Flow', 'Security Response',
    'Compliance Audit', 'Meeting Execution', 'IT Access Request', 'Document Processing',
  ];

  const filtered = mockWorkflows.filter(w => {
    if (filterTab !== 'ALL' && w.status !== filterTab) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Node palette for builder
  const nodeCategories = [
    { name: 'TRIGGER', color: '#00D4FF', items: ['Webhook Trigger', 'File Upload Trigger', 'Timer Trigger', 'Manual Trigger', 'API Trigger', 'Event Trigger'] },
    { name: 'AI PROCESSING', color: '#00BFA5', items: ['LLM Analysis', 'Document Classification', 'Summarization', 'Decision Generation', 'Risk Analysis'] },
    { name: 'DECISION', color: '#FFB800', items: ['Conditional Routing', 'Threshold Decision', 'Approval Gate', 'Rule Engine', 'Duplicate Detection'] },
    { name: 'ACTION', color: '#FF6B6B', items: ['Invoice Processing', 'Task Assignment', 'Notification', 'Report Generation', 'Purchase Order'] },
    { name: 'DATA', color: '#A78BFA', items: ['Data Storage', 'Data Retrieval', 'File Storage', 'Audit Storage'] },
    { name: 'MONITORING', color: '#60A5FA', items: ['SLA Monitoring', 'Bottleneck Detection', 'Health Check', 'Alert Node'] },
    { name: 'UTILITY', color: '#F59E0B', items: ['Delay', 'Retry', 'Parallel Execution', 'Merge', 'Workflow Completion'] },
  ];

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(nodeCategories.map(c => c.name)));
  const [canvasNodes, setCanvasNodes] = useState<Array<{ id: string; type: string; name: string; x: number; y: number; category: string; color: string }>>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeSearch, setNodeSearch] = useState('');

  const addNode = (name: string, cat: typeof nodeCategories[0]) => {
    const id = `node-${Date.now()}`;
    const x = 200 + Math.random() * 300;
    const y = 100 + Math.random() * 200;
    setCanvasNodes(prev => [...prev, { id, type: name, name, x, y, category: cat.name, color: cat.color }]);
    setSelectedNode(id);
  };

  const toggleCat = (name: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  if (showBuilder) {
    const selNode = canvasNodes.find(n => n.id === selectedNode);
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeScale 220ms ease' }}>
        {/* Builder Header */}
        <div style={{
          height: 48, borderBottom: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0,
        }}>
          <button onClick={() => setShowBuilder(false)} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>← Workflows</button>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
            {selectedWorkflow ? mockWorkflows.find(w => w.id === selectedWorkflow)?.name || 'New Workflow' : 'New Workflow'}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px',
            background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green-primary)',
          }}>DRAFT</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '▶ RUN', primary: true },
              { label: '💾 SAVE', primary: false },
              { label: '⟲ UNDO', primary: false },
              { label: '↻ REDO', primary: false },
              { label: '⊕ FIT', primary: false },
            ].map((btn, i) => (
              <button key={i} style={{
                height: 28, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
                background: btn.primary ? 'var(--green-dim)' : 'transparent',
                border: btn.primary ? '1px solid var(--green-border)' : '1px solid var(--border)',
                color: btn.primary ? 'var(--green-primary)' : 'var(--text-secondary)',
              }}>{btn.label}</button>
            ))}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{canvasNodes.length} nodes</span>
        </div>

        {/* Builder Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Node Palette */}
          <div style={{ width: 220, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ borderBottom: '1px solid var(--border)' }}>
              <input
                value={nodeSearch}
                onChange={e => setNodeSearch(e.target.value)}
                placeholder="🔍 Search nodes..."
                style={{ width: '100%', height: 36, border: 'none', borderBottom: '1px solid var(--border)', padding: '0 12px', fontSize: 11, fontFamily: 'var(--font-mono)' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {nodeCategories.map(cat => {
                const items = nodeSearch ? cat.items.filter(n => n.toLowerCase().includes(nodeSearch.toLowerCase())) : cat.items;
                if (nodeSearch && items.length === 0) return null;
                return (
                  <div key={cat.name}>
                    <button
                      onClick={() => toggleCat(cat.name)}
                      style={{
                        width: '100%', height: 32, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 6,
                        fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)',
                      }}
                    >
                      <span>{expandedCats.has(cat.name) ? '▼' : '▶'}</span>
                      <span>{cat.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 8, color: 'var(--text-muted)' }}>{cat.items.length}</span>
                    </button>
                    {expandedCats.has(cat.name) && items.map((n, i) => (
                      <button
                        key={i}
                        onClick={() => addNode(n, cat)}
                        draggable
                        style={{
                          width: '100%', height: 36, padding: '0 16px 0 28px', display: 'flex', alignItems: 'center', gap: 6,
                          fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
                          cursor: 'grab',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tile-hover)'; e.currentTarget.style.borderLeft = `2px solid ${cat.color}`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = 'none'; }}
                      >
                        <span style={{ width: 6, height: 6, background: cat.color, flexShrink: 0 }} />
                        {n}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Canvas */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--bg-base)',
            backgroundImage: 'radial-gradient(circle, var(--accent-glow) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedNode(null); }}
          >
            {canvasNodes.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 48, opacity: 0.15 }}>⚡</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Drag nodes from the palette to build your workflow</span>
              </div>
            )}
            {/* SVG edges simplified */}
            {canvasNodes.length > 1 && (
              <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                {canvasNodes.slice(0, -1).map((n, i) => {
                  const next = canvasNodes[i + 1];
                  return (
                    <path
                      key={i}
                      d={`M ${n.x + 180} ${n.y + 32} C ${n.x + 240} ${n.y + 32}, ${next.x - 60} ${next.y + 32}, ${next.x} ${next.y + 32}`}
                      stroke="var(--accent-border)" strokeWidth={1.5} fill="none"
                    />
                  );
                })}
              </svg>
            )}
            {canvasNodes.map(node => (
              <div
                key={node.id}
                onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                style={{
                  position: 'absolute', left: node.x, top: node.y, width: 180, minHeight: 64,
                  background: 'var(--bg-tile)',
                  border: selectedNode === node.id ? '1px solid var(--green-primary)' : '1px solid var(--border)',
                  boxShadow: selectedNode === node.id ? 'var(--shadow-active)' : undefined,
                  cursor: 'move',
                }}
              >
                <div style={{
                  height: 32, borderBottom: '1px solid var(--border)', display: 'flex',
                  alignItems: 'center', gap: 6, padding: '0 10px',
                }}>
                  <span style={{ width: 6, height: 6, background: node.color }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{node.category}</span>
                  <button onClick={(e) => { e.stopPropagation(); setCanvasNodes(prev => prev.filter(n => n.id !== node.id)); }}
                    style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>✕</button>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{node.name}</div>
                </div>
                {/* Ports */}
                <div style={{
                  position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-base)',
                }} />
                <div style={{
                  position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                  width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-base)',
                }} />
              </div>
            ))}
          </div>

          {/* Properties Panel */}
          <div style={{ width: 320, borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-panel)', flexShrink: 0 }}>
            {selNode ? (
              <>
                <div style={{
                  height: 40, borderBottom: '1px solid var(--border)', display: 'flex',
                  alignItems: 'center', gap: 8, padding: '0 16px',
                }}>
                  <span style={{ width: 6, height: 6, background: selNode.color }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: selNode.color }}>{selNode.category}</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>{selNode.name}</div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>NODE NAME</label>
                    <input defaultValue={selNode.name} style={{ width: '100%', height: 32 }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                    <textarea rows={3} style={{ width: '100%', minHeight: 80, resize: 'vertical' }} />
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginBottom: 12 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>RETRY CONFIGURATION</div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MAX RETRIES</label>
                      <input type="number" defaultValue={3} min={0} max={10} style={{ width: '100%', height: 32 }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TIMEOUT (seconds)</label>
                      <input type="number" defaultValue={30} style={{ width: '100%', height: 32 }} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FAILURE POLICY</label>
                      <select style={{ width: '100%', height: 32 }}>
                        <option>retry</option>
                        <option>escalate</option>
                        <option>abort</option>
                      </select>
                    </div>
                  </div>
                  <button style={{
                    width: '100%', height: 36, background: 'var(--green-dim)',
                    border: '1px solid var(--green-border)', fontFamily: 'var(--font-mono)',
                    fontSize: 11, textTransform: 'uppercase', color: 'var(--green-primary)',
                  }}>TEST THIS NODE</button>
                </div>
              </>
            ) : (
              <div style={{ padding: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>SELECT A NODE</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Click any node on the canvas to edit its properties</div>
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 16 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>WORKFLOW SETTINGS</div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>WORKFLOW NAME</label>
                    <input defaultValue="New Workflow" style={{ width: '100%', height: 32 }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CATEGORY</label>
                    <select style={{ width: '100%', height: 32 }}>
                      <option>Finance</option><option>HR</option><option>Operations</option><option>Security</option><option>Compliance</option><option>IT</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                    <textarea rows={3} style={{ width: '100%', minHeight: 80, resize: 'vertical' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Workflow List View
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      {/* Header */}
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>WORKFLOWS</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <GlassButton
            variant="primary"
            onClick={() => { setShowBuilder(true); setSelectedWorkflow(null); setCanvasNodes([]); }}
          >
            + NEW WORKFLOW
          </GlassButton>
          <GlassButton variant="outline">
            IMPORT
          </GlassButton>
        </div>
      </div>

      {/* Filter Row */}
      <div style={{
        height: 40, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {filterTabs.map(t => (
            <button key={t} onClick={() => setFilterTab(t)} style={{
              padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
              color: filterTab === t ? 'var(--accent)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: filterTab === t ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{t}</button>
          ))}
        </div>
        <GlassInput
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Search..."
          style={{ width: 200, height: 26, fontSize: 11 }}
        />
      </div>

      {/* Workflow Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((wf, i) => (
          <motion.div
            key={wf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <GlassCard noPadding>
              <div style={{
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
              }}>
                {/* Status */}
                <div style={{ width: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <StatusDot status={wf.status === 'ACTIVE' ? 'active' : wf.status === 'FAILED' ? 'error' : 'idle'} size={12} />
                  <GlassBadge 
                    variant={wf.status === 'ACTIVE' ? 'success' : wf.status === 'FAILED' ? 'danger' : 'neutral'}
                    style={{ fontSize: 8 }}
                  >
                    {wf.status}
                  </GlassBadge>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{wf.name}</span>
                    <GlassBadge variant="neutral" style={{ fontSize: 9 }}>{wf.category}</GlassBadge>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {wf.nodes} nodes · {wf.runs} runs · {wf.success}% success · Avg {wf.avgTime}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>Agents:</span>
                    {wf.agents.map((a, j) => (
                      <GlassBadge key={j} style={{ 
                        background: `${a.color}18`, 
                        border: `1px solid ${a.color}44`, 
                        color: a.color,
                        fontSize: 10,
                      }}>
                        {a.name}
                      </GlassBadge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={() => { setSelectedWorkflow(wf.id); setShowBuilder(true); }}
                  >
                    OPEN
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm">RUN</GlassButton>
                  <GlassButton variant="outline" size="sm">···</GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {/* Templates */}
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>WORKFLOW TEMPLATES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {templates.map((t, i) => (
              <div
                key={i}
                onClick={() => { setShowBuilder(true); setSelectedWorkflow(null); }}
                style={{ cursor: 'pointer' }}
              >
                <GlassPanel
                  style={{
                    height: 72,
                    display: 'grid',
                    placeItems: 'center',
                    padding: 12,
                    textAlign: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>
                    {t}
                  </span>
                </GlassPanel>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowStudio;
