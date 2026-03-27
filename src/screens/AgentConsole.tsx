import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState, Message } from '../../types/agent';
import { SAMPLES } from '../../constants/samples';
import StatusDot from '../shared/StatusDot';

interface AgentConsoleProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onSelectAgent: (id: string) => void;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
  onUseSample: (id: string) => Promise<void>;
  runAllProgress: string | null;
  onRunAll: () => Promise<void>;
}

const AgentConsole: React.FC<AgentConsoleProps> = ({
  agents, agentStates, onSelectAgent, onExecuteAgent, onUseSample, runAllProgress, onRunAll,
}) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();
  const [search, setSearch] = useState('');
  const [inputText, setInputText] = useState('');
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const selectedId = agentId || null;
  const selectedAgent = selectedId ? agents.find(a => a.id === selectedId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;

  const filtered = agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const handleSend = async () => {
    if (!selectedId || !inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await onExecuteAgent(selectedId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderResult = (result: Record<string, unknown>) => {
    if (!result) return null;
    return (
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6 }}>
        {result.summary && <p style={{ marginBottom: 12 }}>{String(result.summary)}</p>}
        {result.decision && (
          <div style={{
            padding: '8px 12px', marginBottom: 8,
            background: String(result.decision).includes('APPROVE') ? 'var(--green-dim)' : String(result.decision).includes('REJECT') ? 'rgba(255,45,85,0.1)' : 'rgba(255,184,0,0.1)',
            border: `1px solid ${String(result.decision).includes('APPROVE') ? 'var(--green-border)' : String(result.decision).includes('REJECT') ? 'var(--border-danger)' : 'var(--border-warning)'}`,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{String(result.decision)}</span>
          </div>
        )}
        {result.tasks && Array.isArray(result.tasks) && result.tasks.length > 0 && (
          <div style={{ border: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              ACTION ITEMS ({result.tasks.length})
            </div>
            {(result.tasks as Array<Record<string, unknown>>).map((t, i) => (
              <div key={i} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
                <span style={{ color: 'var(--green-primary)', fontFamily: 'var(--font-mono)', marginRight: 8 }}>{i + 1}.</span>
                {t.task || t.description || String(t)}
                {t.owner && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginLeft: 8 }}>→ {String(t.owner)}</span>}
              </div>
            ))}
          </div>
        )}
        {result.decisions && Array.isArray(result.decisions) && (
          <div style={{ border: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              DECISIONS ({result.decisions.length})
            </div>
            {(result.decisions as Array<Record<string, unknown>>).map((d, i) => (
              <div key={i} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
                {d.decision || d.text || String(d)}
              </div>
            ))}
          </div>
        )}
        {result.risks && Array.isArray(result.risks) && result.risks.length > 0 && (
          <div style={{ border: '1px solid var(--border-danger)', background: 'rgba(255,45,85,0.05)', marginBottom: 8 }}>
            <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-danger)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--status-danger)' }}>
              RISKS ({result.risks.length})
            </div>
            {(result.risks as Array<Record<string, unknown>>).map((r, i) => (
              <div key={i} style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 12, borderLeft: '2px solid var(--status-danger)' }}>
                {r.risk || r.description || String(r)}
              </div>
            ))}
          </div>
        )}
        {/* Render any other non-rendered object fields as key-value */}
        {Object.entries(result).filter(([k]) => !['summary', 'decision', 'tasks', 'decisions', 'risks', 'reason'].includes(k)).map(([key, val]) => {
          if (val === null || val === undefined) return null;
          if (typeof val === 'object' && !Array.isArray(val)) return null;
          if (Array.isArray(val) && val.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{key}: </span>
              <span style={{ fontSize: 12 }}>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
            </div>
          );
        })}
        {result.reason && (
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 8 }}>
            WHY: {String(result.reason)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', animation: 'fadeScale 220ms ease' }}>
      {/* Left Panel — Agent List */}
      <div style={{
        width: 260, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
        background: 'var(--bg-panel)', flexShrink: 0,
      }}>
        <div style={{
          height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
        }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AGENTS</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)',
            background: 'var(--green-dim)', border: '1px solid var(--green-border)', padding: '2px 8px',
          }}>{agents.length} ACTIVE</span>
        </div>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search agents..."
            style={{ width: '100%', height: 32, fontSize: 12 }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map(agent => {
            const state = agentStates[agent.id];
            const isSelected = selectedId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => navigate(`/agents/${agent.id}`)}
                style={{
                  width: '100%', height: 60, borderBottom: '1px solid var(--border-subtle)',
                  padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10,
                  background: isSelected ? 'var(--bg-tile-active)' : 'transparent',
                  borderLeft: isSelected ? `2px solid ${agent.color}` : '2px solid transparent',
                  textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-tile-hover)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${agent.color}15`, border: `1px solid ${agent.color}66`,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: agent.color,
                  boxShadow: state?.status === 'processing' ? `0 0 10px ${agent.color}66` : undefined,
                }}>{agent.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{agent.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                      {state?.lastActivity ? new Date(state.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {agent.subtitle}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {state?.taskCount ? (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      background: `${agent.color}25`, border: `1px solid ${agent.color}66`,
                      padding: '1px 6px', color: agent.color,
                    }}>{state.taskCount}</span>
                  ) : null}
                  <StatusDot
                    status={state?.status === 'processing' ? 'processing' : state?.status === 'complete' ? 'active' : state?.status === 'error' ? 'error' : 'idle'}
                    color={agent.color}
                    size={6}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ height: 56, borderTop: '1px solid var(--border)', padding: 12 }}>
          <button
            onClick={() => onRunAll()}
            disabled={!!runAllProgress}
            style={{
              width: '100%', height: 32, background: 'var(--green-dim)',
              border: '1px solid var(--green-border)', fontFamily: 'var(--font-mono)',
              fontSize: 10, textTransform: 'uppercase', color: 'var(--green-primary)',
            }}
          >{runAllProgress || '▶ RUN ALL AGENTS'}</button>
        </div>
      </div>

      {/* Center Panel — Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedAgent ? (
          <>
            {/* Chat Header */}
            <div style={{
              height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `${selectedAgent.color}15`, border: `1px solid ${selectedAgent.color}66`,
                  display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: selectedAgent.color,
                }}>{selectedAgent.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{selectedAgent.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-secondary)' }}>
                    {selectedState?.status === 'processing' ? 'Processing...' : selectedState?.status === 'complete' ? 'Completed' : 'Ready'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => onUseSample(selectedAgent.id)}
                  style={{
                    height: 28, padding: '0 12px', background: 'transparent',
                    border: '1px solid var(--border)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, color: 'var(--text-secondary)',
                  }}
                >USE SAMPLE</button>
                <button
                  onClick={() => onExecuteAgent(selectedAgent.id)}
                  style={{
                    height: 28, padding: '0 12px', background: 'var(--green-dim)',
                    border: '1px solid var(--green-border)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, color: 'var(--green-primary)',
                  }}
                >▶ EXECUTE</button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedState?.messages.map((msg, i) => {
                if (msg.type === 'user') {
                  return (
                    <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '65%', animation: 'slideInBottom 200ms ease' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textAlign: 'right', marginBottom: 4 }}>YOU · INPUT</div>
                      <div style={{
                        background: 'var(--bg-msg-out)', border: '1px solid var(--border)',
                        borderRight: '2px solid var(--text-muted)', padding: '10px 14px',
                      }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4 }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                }
                if (msg.type === 'agent') {
                  return (
                    <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '80%', animation: 'slideInBottom 200ms ease' }}>
                      <div style={{
                        background: 'var(--bg-msg-in)', border: '1px solid var(--border)',
                        borderLeft: `2px solid ${selectedAgent.color}`, padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${selectedAgent.color}25`, display: 'grid', placeItems: 'center', fontSize: 8, color: selectedAgent.color }}>{selectedAgent.icon[0]}</div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: selectedAgent.color, textTransform: 'uppercase' }}>{selectedAgent.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>·</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {msg.processingTime && (
                          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, border: '1px solid var(--border)', padding: '1px 6px', color: 'var(--text-muted)' }}>{msg.processingTime}ms</span>
                            {msg.model && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>{msg.model}</span>}
                          </div>
                        )}
                        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />
                        {msg.result ? renderResult(msg.result) : <p style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{msg.content}</p>}
                      </div>
                    </div>
                  );
                }
                if (msg.type === 'insight') {
                  return (
                    <div key={i} style={{
                      alignSelf: 'flex-start', maxWidth: '80%',
                      background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.3)',
                      borderLeft: '2px solid var(--status-info)', padding: '10px 14px',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--status-info)', textTransform: 'uppercase', marginBottom: 4 }}>◆ NIYANTA INSIGHT</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{msg.content}</div>
                    </div>
                  );
                }
                if (msg.type === 'error') {
                  return (
                    <div key={i} style={{
                      alignSelf: 'flex-start', maxWidth: '80%',
                      background: 'rgba(255,45,85,0.05)', border: '1px solid var(--border-danger)',
                      borderLeft: '2px solid var(--status-danger)', padding: '10px 14px',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--status-danger)', textTransform: 'uppercase', marginBottom: 4 }}>AGENT ERROR</div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>{msg.content}</div>
                      <button
                        onClick={() => onExecuteAgent(selectedAgent.id)}
                        style={{
                          marginTop: 8, height: 24, padding: '0 10px',
                          background: 'rgba(255,45,85,0.1)', border: '1px solid var(--border-danger)',
                          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--status-danger)',
                        }}
                      >RETRY</button>
                    </div>
                  );
                }
                return null;
              })}
              {selectedState?.status === 'processing' && (
                <div style={{
                  alignSelf: 'flex-start', borderLeft: `2px solid ${selectedAgent.color}`,
                  background: 'var(--bg-msg-in)', border: '1px solid var(--border)', padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} style={{
                        width: 8, height: 8, borderRadius: '50%', background: selectedAgent.color,
                        animation: `blink 1.2s ${j * 0.15}s infinite`,
                      }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Niyanta agent processing...</span>
                </div>
              )}
              {(!selectedState?.messages || selectedState.messages.length === 0) && selectedState?.status !== 'processing' && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', border: `1px solid ${selectedAgent.color}33`,
                    display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: 20, color: `${selectedAgent.color}44`,
                  }}>{selectedAgent.icon}</div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-muted)' }}>{selectedAgent.name}</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>Send a message or use sample data to begin</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div style={{
              borderTop: '1px solid var(--border)', padding: '10px 16px',
              display: 'flex', alignItems: 'flex-end', gap: 10,
            }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSampleMenu(!showSampleMenu)}
                  style={{
                    width: 36, height: 36, background: 'var(--bg-tile)',
                    border: '1px solid var(--border)', display: 'grid', placeItems: 'center',
                    fontSize: 16, color: 'var(--text-secondary)',
                  }}
                >📎</button>
                {showSampleMenu && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: 0, zIndex: 10,
                    background: 'var(--bg-panel)', border: '1px solid var(--border)', minWidth: 180,
                  }}>
                    <button
                      onClick={() => {
                        setInputText(SAMPLES[selectedAgent.id] || '');
                        setShowSampleMenu(false);
                      }}
                      style={{
                        width: '100%', padding: '8px 12px', textAlign: 'left',
                        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-primary)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >📋 Use Sample Data</button>
                  </div>
                )}
              </div>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${selectedAgent.name}...`}
                rows={1}
                style={{
                  flex: 1, minHeight: 40, maxHeight: 160, resize: 'vertical',
                  background: 'var(--bg-input)', border: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontSize: 14, padding: '10px 12px',
                  lineHeight: 1.4,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || selectedState?.status === 'processing'}
                style={{
                  width: 36, height: 36,
                  background: inputText.trim() ? 'var(--green-dim)' : 'var(--bg-tile)',
                  border: inputText.trim() ? '1px solid var(--green-border)' : '1px solid var(--border)',
                  display: 'grid', placeItems: 'center', fontSize: 14,
                  color: inputText.trim() ? 'var(--green-primary)' : 'var(--text-muted)',
                }}
              >▶</button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16,
            backgroundImage: 'radial-gradient(circle, rgba(0,255,136,0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', border: '1px solid var(--border)',
              display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)',
              fontWeight: 800, fontSize: 24, color: 'var(--text-muted)',
            }}>नि</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-muted)', letterSpacing: '0.3em' }}>NIYANTA</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>Select an agent to begin</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {agents.map(a => (
                <span key={a.id} style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, cursor: 'pointer' }}
                  onClick={() => navigate(`/agents/${a.id}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Panel — Agent Info */}
      {selectedAgent && (
        <div style={{
          width: 300, borderLeft: '1px solid var(--border)', overflowY: 'auto',
          background: 'var(--bg-panel)', flexShrink: 0,
        }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${selectedAgent.color}15`, border: `1px solid ${selectedAgent.color}66`,
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: selectedAgent.color,
              }}>{selectedAgent.icon}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{selectedAgent.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{selectedAgent.subtitle}</div>
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 8px',
                background: selectedState?.status === 'complete' ? 'var(--green-dim)' : 'var(--bg-tile)',
                border: selectedState?.status === 'complete' ? '1px solid var(--green-border)' : '1px solid var(--border)',
                color: selectedState?.status === 'complete' ? 'var(--green-primary)' : 'var(--text-secondary)',
                textTransform: 'uppercase',
              }}>{selectedState?.status || 'IDLE'}</span>
            </div>

            {/* Capabilities */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>CAPABILITIES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {selectedAgent.capabilities.map((c, i) => (
                  <span key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)',
                    border: '1px solid var(--border)', padding: '2px 8px',
                  }}>{c}</span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, marginBottom: 16 }}>
              {[
                { label: 'Total Runs', value: selectedState?.messages.filter(m => m.type === 'agent').length || 0 },
                { label: 'Success Rate', value: '98%' },
                { label: 'Avg Time', value: selectedState?.processingTime ? `${selectedState.processingTime}ms` : '—' },
                { label: 'Last Active', value: selectedState?.lastActivity ? new Date(selectedState.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-tile)', border: '1px solid var(--border)', padding: '8px 12px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{s.value}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>DESCRIPTION</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedAgent.description}</div>
            </div>

            {/* Direct URL */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>DIRECT ACCESS</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green-primary)',
                background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '6px 10px',
                wordBreak: 'break-all',
              }}>/agents/{selectedAgent.id}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentConsole;
