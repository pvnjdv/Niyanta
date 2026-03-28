import React, { useState } from 'react';

interface WorkflowStudioProps {
  workflows: Array<{ id?: string; name?: string; status?: string; description?: string; category?: string }>;
  onSaveWorkflow: (nodes: any[], edges: any[]) => Promise<void>;
}

const WorkflowStudio: React.FC<WorkflowStudioProps> = ({ workflows, onSaveWorkflow }) => {
  // State management
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [environment, setEnvironment] = useState<'test' | 'staging' | 'production'>('test');
  const [workflowStatus, setWorkflowStatus] = useState<'idle' | 'running' | 'paused' | 'error'>('idle');
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [bottomTab, setBottomTab] = useState<'logs' | 'errors' | 'context' | 'timeline' | 'audit'>('logs');
  
  // Node management
  const [nodeSearch, setNodeSearch] = useState('');
  const [canvasNodes, setCanvasNodes] = useState<Array<{ id: string; type: string; name: string; x: number; y: number; category: string; color: string }>>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Mock data
  const mockWorkflows = [
    { id: 'wf-1', name: 'Invoice-to-Payment Automation', status: 'ACTIVE', category: 'Finance' },
    { id: 'wf-2', name: 'Meeting Action Tracker', status: 'ACTIVE', category: 'Productivity' },
    { id: 'wf-3', name: 'Document Classification Flow', status: 'ACTIVE', category: 'Document' },
  ];

  // Node categories
  const nodeCategories = [
    { name: 'TRIGGER', color: '#8B5CF6', items: ['Manual Trigger', 'File Upload', 'API Trigger', 'Timer', 'Schedule', 'Webhook'] },
    { name: 'DOCUMENT', color: '#EC4899', items: ['OCR', 'PDF Reader', 'Document Classifier', 'Field Extractor', 'Validation', 'Header/Footer Cleaner'] },
    { name: 'DATA', color: '#10B981', items: ['Save Data', 'Read Data', 'Cache', 'Metadata', 'Dataset Loader'] },
    { name: 'AI', color: '#F59E0B', items: ['LLM Reasoning', 'Classification', 'Summarization', 'Decision', 'Risk Analysis'] },
    { name: 'LOGIC', color: '#3B82F6', items: ['If/Else', 'Switch', 'Loop', 'Parallel', 'Merge', 'Delay', 'Retry'] },
    { name: 'BUSINESS', color: '#EF4444', items: ['Invoice Processor', 'Approval', 'Notification', 'Task Assignment', 'Purchase Order', 'Payment'] },
    { name: 'MONITORING', color: '#F97316', items: ['SLA Timer', 'Alert', 'Metrics', 'Bottleneck Detector'] },
    { name: 'OUTPUT', color: '#06B6D4', items: ['CSV Export', 'Excel Export', 'PDF Report', 'JSON Export', 'Dashboard Update'] },
  ];

  // Initialize expanded categories
  React.useEffect(() => {
    setExpandedCats(new Set(nodeCategories.map(c => c.name)));
  }, []);

  const toggleCat = (name: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev);
      if (n.has(name)) n.delete(name); else n.add(name);
      return n;
    });
  };

  const addNode = (name: string, cat: typeof nodeCategories[0]) => {
    const id = `node-${Date.now()}`;
    const x = 200 + Math.random() * 300;
    const y = 100 + Math.random() * 200;
    setCanvasNodes(prev => [...prev, { id, type: name, name, x, y, category: cat.name, color: cat.color }]);
    setSelectedNode(id);
  };

  const statusColors = {
    idle: 'var(--text-muted)',
    running: 'var(--accent)',
    paused: 'var(--status-warning)',
    error: 'var(--status-danger)',
  };

  const selNode = canvasNodes.find(n => n.id === selectedNode);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ===== TOP BAR ===== */}
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, background: 'var(--bg-dock)',
      }}>
        {/* Workflow Selector */}
        <select 
          value={selectedWorkflow || ''}
          onChange={(e) => setSelectedWorkflow(e.target.value || null)}
          style={{ 
            height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 11,
            background: 'var(--bg-tile)', border: '1px solid var(--border)', 
            minWidth: 200, cursor: 'pointer',
          }}
        >
          <option value="">+ New Workflow</option>
          {mockWorkflows.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        {/* Workflow Name (Editable) */}
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="Workflow name..."
          style={{
            height: 32, padding: '0 12px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
            background: 'transparent', border: '1px solid transparent', flex: 1, maxWidth: 400,
          }}
          onFocus={(e) => { e.target.style.border = '1px solid var(--border)'; e.target.style.background = 'var(--bg-tile)'; }}
          onBlur={(e) => { e.target.style.border = '1px solid transparent'; e.target.style.background = 'transparent'; }}
        />

        {/* Environment Selector */}
        <select
          value={environment}
          onChange={(e) => setEnvironment(e.target.value as any)}
          style={{
            height: 28, padding: '0 8px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--bg-tile)', border: '1px solid var(--border)', textTransform: 'uppercase',
          }}
        >
          <option value="test">Test</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={() => setWorkflowStatus(workflowStatus === 'running' ? 'idle' : 'running')}
            style={{
              height: 32, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{workflowStatus === 'running' ? '■' : '▶'}</span>
            <span>{workflowStatus === 'running' ? 'STOP' : 'RUN'}</span>
          </button>

          <button style={{
            height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>SAVE</button>

          <button style={{
            height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>EXPORT</button>

          <button style={{
            height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}>IMPORT</button>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

        {/* Undo/Redo */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button 
            style={{
              height: 28, width: 28, fontFamily: 'var(--font-mono)', fontSize: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            title="Undo (Ctrl+Z)"
          >↶</button>

          <button 
            style={{
              height: 28, width: 28, fontFamily: 'var(--font-mono)', fontSize: 12,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            title="Redo (Ctrl+Shift+Z)"
          >↷</button>
        </div>

        <button style={{
          height: 28, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 10,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer',
        }}>HISTORY</button>

        <div style={{ flex: 1 }} />

        {/* Status Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
          border: '1px solid var(--border)', borderRadius: 2,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: statusColors[workflowStatus],
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColors[workflowStatus], textTransform: 'uppercase' }}>
            {workflowStatus}
          </span>
        </div>

        {/* Node Count */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          {canvasNodes.length} nodes
        </span>
      </div>

      {/* ===== MAIN CONTENT (3-panel layout) ===== */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* LEFT PANEL - Node Library */}
        <div style={{ width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-panel)' }}>
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
              NODE LIBRARY
            </span>
          </div>

          <div style={{ borderBottom: '1px solid var(--border)' }}>
            <input
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
              placeholder="Search nodes..."
              style={{ 
                width: '100%', height: 40, border: 'none', padding: '0 12px', 
                fontSize: 12, fontFamily: 'var(--font-body)',
                background: 'var(--bg-tile)',
              }}
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
                      width: '100%', height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)',
                      background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    <span style={{ fontSize: 8 }}>{expandedCats.has(cat.name) ? '▼' : '▶'}</span>
                    <span>{cat.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--text-muted)' }}>{items.length}</span>
                  </button>
                  {expandedCats.has(cat.name) && items.map((n, i) => (
                    <button
                      key={i}
                      onClick={() => addNode(n, cat)}
                      draggable
                      style={{
                        width: '100%', height: 40, padding: '0 12px 0 32px', display: 'flex', alignItems: 'center', gap: 8,
                        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textAlign: 'left',
                        cursor: 'grab', background: 'none', border: 'none', borderLeft: '2px solid transparent',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => { 
                        e.currentTarget.style.background = 'var(--bg-tile-hover)'; 
                        e.currentTarget. style.borderLeft = `2px solid ${cat.color}`; 
                      }}
                      onMouseLeave={e => { 
                        e.currentTarget.style.background = 'transparent'; 
                        e.currentTarget.style.borderLeft = '2px solid transparent'; 
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER PANEL - Canvas */}
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
              flexDirection: 'column', gap: 12,
            }}>
              <span style={{ fontSize: 48, opacity: 0.1 }}>◈</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
                Drag nodes from the palette to build your workflow
              </span>
            </div>
          )}

          {/* Node connections */}
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

          {/* Nodes */}
          {canvasNodes.map(node => (
            <div
              key={node.id}
              onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
              style={{
                position: 'absolute', left: node.x, top: node.y, width: 180, minHeight: 64,
                background: 'var(--bg-tile)',
                border: selectedNode === node.id ? `2px solid ${node.color}` : '1px solid var(--border)',
                boxShadow: selectedNode === node.id ? `0 0 0 3px ${node.color}20` : undefined,
                cursor: 'move',
                borderRadius: 4,
              }}
            >
              <div style={{
                height: 32, borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', gap: 6, padding: '0 10px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: node.color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{node.category}</span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setCanvasNodes(prev => prev.filter(n => n.id !== node.id)); 
                    if (selectedNode === node.id) setSelectedNode(null);
                  }}
                  style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
                >✕</button>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{node.name}</div>
              </div>
              {/* Connection dots */}
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

          {/* Canvas Controls (bottom-right) */}
          <div style={{
            position: 'absolute', bottom: 16, right: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <button style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>ZOOM 100%</button>
            <button style={{
              height: 32, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
              background: 'var(--bg-tile)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>AUTO-LAYOUT</button>
          </div>
        </div>

        {/* RIGHT PANEL - Node Config */}
        <div style={{ width: 320, borderLeft: '1px solid var(--border)', overflowY: 'auto', background: 'var(--bg-panel)', flexShrink: 0 }}>
          {selNode ? (
            <>
              <div style={{
                height: 48, borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', gap: 8, padding: '0 16px',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: selNode.color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {selNode.category}
                </span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{selNode.name}</div>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    NODE NAME
                  </label>
                  <input defaultValue={selNode.name} style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13 }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    DESCRIPTION
                  </label>
                  <textarea rows={3} placeholder="Node description..." style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: '8px 10px', fontSize: 13 }} />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16, marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                    ADVANCED SETTINGS
                  </div>
                  
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>MAX RETRIES</label>
                    <input type="number" defaultValue={3} min={0} max={10} style={{ width: '100%', height: 32, padding: '0 10px' }} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TIMEOUT (seconds)</label>
                    <input type="number" defaultValue={30} style={{ width: '100%', height: 32, padding: '0 10px' }} />
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>FAILURE POLICY</label>
                    <select style={{ width: '100%', height: 32, padding: '0 8px' }}>
                      <option>Retry</option>
                      <option>Escalate</option>
                      <option>Abort</option>
                    </select>
                  </div>
                </div>

                <button style={{
                  width: '100%', height: 40, background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)', fontFamily: 'var(--font-mono)',
                  fontSize: 11, textTransform: 'uppercase', color: 'var(--accent)',
                  cursor: 'pointer', fontWeight: 600,
                }}>TEST NODE</button>
              </div>
            </>
          ) : (
            <div style={{ padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
                NO NODE SELECTED
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Click any node on the canvas to edit its properties and configuration
              </div>

              <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12, fontWeight: 600 }}>
                  WORKFLOW SETTINGS
                </div>
                
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CATEGORY</label>
                  <select style={{ width: '100%', height: 32, padding: '0 8px' }}>
                    <option>Finance</option>
                    <option>HR</option>
                    <option>Operations</option>
                    <option>Security</option>
                    <option>Compliance</option>
                    <option>IT</option>
                  </select>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>TAGS</label>
                  <input placeholder="invoice, approval, finance..." style={{ width: '100%', height: 32, padding: '0 10px' }} />
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                  <textarea rows={3} placeholder="Workflow description..." style={{ width: '100%', minHeight: 80, resize: 'vertical', padding: '8px 10px' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== BOTTOM PANEL ===== */}
      {showBottomPanel && (
        <div style={{ 
          height: 250, borderTop: '1px solid var(--border)', 
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          background: 'var(--bg-panel)',
        }}>
          {/* Tab Bar */}
          <div style={{ 
            height: 36, borderBottom: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', padding: '0 12px', gap: 4,
          }}>
            {(['logs', 'errors', 'context', 'timeline', 'audit'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setBottomTab(tab)}
                style={{
                  height: 28, padding: '0 12px', fontFamily: 'var(--font-mono)', fontSize: 10,
                  textTransform: 'uppercase', background: 'transparent', border: 'none',
                  color: bottomTab === tab ? 'var(--accent)' : 'var(--text-muted)',
                  borderBottom: bottomTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >{tab}</button>
            ))}
            
            <div style={{ flex: 1 }} />
            
            <button
              onClick={() => setShowBottomPanel(false)}
              style={{
                height: 24, width: 24, fontFamily: 'var(--font-mono)', fontSize: 12,
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
              }}
              title="Close panel"
            >✕</button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {bottomTab === 'logs' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: 8 }}>[12:34:56] Workflow started</div>
                <div style={{ marginBottom: 8 }}>[12:34:57] Manual Trigger node executed successfully</div>
                <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>No execution logs yet. Run the workflow to see logs here.</div>
              </div>
            )}
            
            {bottomTab === 'errors' && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                No errors
              </div>
            )}

            {bottomTab === 'context' && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                <pre style={{ margin: 0 }}>{'{\n  "workflow": {},\n  "nodes": [],\n  "context": {}\n}'}</pre>
              </div>
            )}

            {bottomTab === 'timeline' && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Execution timeline will appear here
              </div>
            )}

            {bottomTab === 'audit' && (
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>
                Audit trail will appear here
              </div>
            )}
          </div>
        </div>
      )}

      {/* Show Bottom Panel button when hidden */}
      {!showBottomPanel && (
        <button
          onClick={() => setShowBottomPanel(true)}
          style={{
            position: 'fixed', bottom: 16, right: 16,
            height: 36, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--bg-tile)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >SHOW LOGS</button>
      )}
    </div>
  );
};

export default WorkflowStudio;
