import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { SAMPLES } from '../constants/samples';

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

  // State
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCapabilities, setNewCapabilities] = useState('');
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [availableWorkflows, setAvailableWorkflows] = useState<Array<{id: string; name: string; description: string; category: string}>>([]);
  const [linkedWorkflows, setLinkedWorkflows] = useState<Array<{workflow_id: string; name: string; description: string; category: string; can_trigger: number}>>([]);
  const [inputText, setInputText] = useState('');

  const selectedId = agentId || null;
  const selectedAgent = selectedId ? agents.find(a => a.id === selectedId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;
  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  // Fetch available workflows
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
  
  // Fetch linked workflows for selected agent
  useEffect(() => {
    const fetchLinkedWorkflows = async () => {
      if (!selectedId) {
        setLinkedWorkflows([]);
        return;
      }
      
      try {
        const res = await fetch(`http://localhost:3001/api/agent/${selectedId}/workflows`);
        if (res.ok) {
          const data = await res.json();
          setLinkedWorkflows(data.workflows || []);
        }
      } catch (err) {
        console.error('Failed to fetch linked workflows:', err);
      }
    };
    fetchLinkedWorkflows();
  }, [selectedId]);

  // Create agent
  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('http://localhost:3001/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName.trim(), 
          description: newDesc.trim(),
          capabilities: newCapabilities.trim(),
          workflows: selectedWorkflows,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewName('');
        setNewDesc('');
        setNewCapabilities('');
        setSelectedWorkflows([]);
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to create agent:', err);
    }
  };

  // Run agent
  const handleRun = async () => {
    if (!selectedId) return;
    const input = inputText.trim() || SAMPLES[selectedId] || '';
    setInputText('');
    await onExecuteAgent(selectedId, input);
  };

  // Agent list view
  if (!selectedId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        {/* Top Bar */}
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
            onClick={() => setShowCreate(true)}
            style={{
              height: 36, padding: '0 20px', borderRadius: 4, fontWeight: 600,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer', fontSize: 13,
            }}
          >
            + CREATE AGENT
          </button>
        </div>

        {/* Agent Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
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
                    }}>
                      {agent.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {agent.subtitle}
                      </div>
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
                      }}>
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: 10,
                        background: 'var(--bg-tile)', color: 'var(--text-muted)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        +{agent.capabilities.length - 3}
                      </span>
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
                      {state.processingTime && ` • ${state.processingTime}ms`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
                borderRadius: 8, padding: 24, width: 500, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto',
              }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, margin: '0 0 20px', fontWeight: 600 }}>
                Create New Agent
              </h3>
              
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Agent Name *
              </label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g., Invoice Processing Agent"
                style={{
                  width: '100%', height: 40, padding: '0 12px', marginBottom: 16,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 14,
                  color: 'var(--text-primary)', outline: 'none',
                }}
              />
              
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Brief description of agent's purpose"
                rows={2}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: 16,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                }}
              />
              
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Capabilities / Tasks
              </label>
              <textarea
                value={newCapabilities}
                onChange={e => setNewCapabilities(e.target.value)}
                placeholder="e.g., OCR extraction, invoice validation, payment processing"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', marginBottom: 16,
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  borderRadius: 4, fontFamily: 'var(--font-body)', fontSize: 13,
                  color: 'var(--text-primary)', resize: 'vertical', outline: 'none',
                }}
              />
              
              <label style={{ display: 'block', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                Workflows This Agent Can Execute ({selectedWorkflows.length} selected)
              </label>
              <div style={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: 4,
                background: 'var(--bg-input)',
                marginBottom: 20,
              }}>
                {availableWorkflows.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                    No workflows available. Create workflows first in Workflow Studio.
                  </div>
                ) : (
                  availableWorkflows.map(workflow => (
                    <label
                      key={workflow.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selectedWorkflows.includes(workflow.id) ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                      }}
                      onMouseEnter={e => {
                        if (!selectedWorkflows.includes(workflow.id)) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!selectedWorkflows.includes(workflow.id)) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.includes(workflow.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedWorkflows(prev => [...prev, workflow.id]);
                          } else {
                            setSelectedWorkflows(prev => prev.filter(id => id !== workflow.id));
                          }
                        }}
                        style={{ marginRight: 12, cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{workflow.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {workflow.category} • {workflow.description || 'No description'}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 4,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  style={{
                    height: 40, padding: '0 20px', borderRadius: 4, fontWeight: 600,
                    border: '1px solid var(--accent-border)',
                    background: newName.trim() ? 'var(--accent-dim)' : 'var(--bg-tile)',
                    color: newName.trim() ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: newName.trim() ? 'pointer' : 'not-allowed',
                    fontSize: 13,
                  }}
                >
                  Create Agent
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Individual agent chat view
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
        borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--bg-dock)',
      }}>
        <button
          onClick={() => navigate('/agents')}
          style={{
            height: 36, padding: '0 12px', borderRadius: 4,
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
          }}
        >
          ← Back
        </button>
        
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: selectedAgent?.color || '#666',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#fff',
          boxShadow: `0 4px 12px ${selectedAgent?.glow}`,
        }}>
          {selectedAgent?.icon}
        </div>
        
        <div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600 }}>
            {selectedAgent?.name}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {selectedAgent?.subtitle}
          </div>
        </div>
        
        <div style={{ flex: 1 }} />

        {/* Input + Run */}
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
        <button
          onClick={handleRun}
          disabled={selectedState?.status === 'processing'}
          style={{
            height: 40, padding: '0 20px', borderRadius: 4, fontWeight: 600,
            border: '1px solid var(--accent-border)',
            background: selectedState?.status === 'processing' ? 'var(--bg-tile)' : 'var(--accent-dim)',
            color: selectedState?.status === 'processing' ? 'var(--text-muted)' : 'var(--accent)',
            cursor: selectedState?.status === 'processing' ? 'wait' : 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: 12,
          }}
        >
          {selectedState?.status === 'processing' ? 'PROCESSING...' : 'SEND'}
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {selectedState?.result ? (
              <div style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 20,
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
                  textTransform: 'uppercase', marginBottom: 12,
                }}>
                  AGENT RESPONSE
                  {selectedState.processingTime && (
                    <span style={{ marginLeft: 8 }}>• {selectedState.processingTime}ms</span>
                  )}
                </div>
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
                  lineHeight: 1.6,
                }}>
                  {typeof selectedState.result === 'string' 
                    ? selectedState.result 
                    : JSON.stringify(selectedState.result, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}>
                Send a message to {selectedAgent?.name}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Linked Workflows */}
        <div style={{
          width: 320,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-panel)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0, 212, 255, 0.05)',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: 6,
              letterSpacing: '0.05em',
            }}>
              LINKED WORKFLOWS
            </div>
            <div style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              Workflows this agent can execute
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {linkedWorkflows.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
                lineHeight: 1.6,
              }}>
                No workflows linked yet.
                <br />
                Edit agent to add workflows.
              </div>
            ) : (
              linkedWorkflows.map(wf => (
                <div
                  key={wf.workflow_id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => window.open(`/workflows`, '_blank')}
                >
                  <div style={{
                    fontWeight: 500,
                    fontSize: 13,
                    marginBottom: 6,
                    color: 'var(--text-primary)',
                  }}>
                    {wf.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    lineHeight: 1.4,
                  }}>
                    {wf.category} • {wf.description || 'No description'}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: 3,
                    background: 'rgba(0, 255, 136, 0.1)',
                    color: '#00ff88',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 600,
                  }}>
                    CAN EXECUTE
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentConsole;
