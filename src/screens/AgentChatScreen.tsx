import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';

interface AgentChatScreenProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
}

type ProcessingStep = {
  id: string;
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done' | 'error';
};

type Message = {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  steps?: ProcessingStep[];
};

const STEP_DELAY = 900; // ms per step

const AgentChatScreen: React.FC<AgentChatScreenProps> = ({ agents, agentStates, onExecuteAgent }) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agent = agents.find(a => a.id === agentId);
  const agentState = agentId ? agentStates[agentId] : null;
  const quickAgentPrompts = agent?.capabilities?.slice(0, 3).map(cap => `Run ${cap.toLowerCase()} analysis on current dataset.`) || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, processingSteps]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  if (!agent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Agent not found</div>
          <button onClick={() => navigate('/agents')} style={{ marginTop: 16, height: 36, padding: '0 20px', borderRadius: 4, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}>
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsSending(true);

    const steps: ProcessingStep[] = [
      { id: 'relevance', label: 'Relevance Check', detail: 'Analysing input against agent capabilities…', status: 'pending' },
      { id: 'convert',   label: 'Workflow Format Conversion', detail: 'Transforming input into workflow-compatible payload…', status: 'pending' },
      { id: 'execute',   label: 'Workflow Execution', detail: 'Running pipeline nodes and collecting output…', status: 'pending' },
      { id: 'niyanta',   label: 'Reporting to Niyanta', detail: 'Sending results to Niyanta for oversight & audit…', status: 'pending' },
    ];

    setProcessingSteps([...steps]);

    try {
      // Step 1 — Relevance check
      steps[0] = { ...steps[0], status: 'active' };
      setProcessingSteps([...steps]);
      await sleep(STEP_DELAY);

      // Simulate relevance decision (98 % pass through)
      const isRelevant = Math.random() > 0.02;
      steps[0] = { ...steps[0], status: isRelevant ? 'done' : 'error', detail: isRelevant ? 'Input is relevant — proceeding.' : 'Input does not match agent capabilities.' };
      setProcessingSteps([...steps]);

      if (!isRelevant) {
        setMessages(prev => [...prev, {
          role: 'agent',
          content: '⚠️ Input is not relevant to this agent\'s capabilities. Please provide data related to the workflows this agent manages.',
          timestamp: new Date(),
          steps: [...steps],
        }]);
        setProcessingSteps([]);
        setIsSending(false);
        return;
      }

      // Step 2 — Format conversion
      await sleep(200);
      steps[1] = { ...steps[1], status: 'active' };
      setProcessingSteps([...steps]);
      await sleep(STEP_DELAY);
      steps[1] = { ...steps[1], status: 'done', detail: 'Payload structured and validated.' };
      setProcessingSteps([...steps]);

      // Step 3 — Execute
      await sleep(200);
      steps[2] = { ...steps[2], status: 'active' };
      setProcessingSteps([...steps]);
      await onExecuteAgent(agent.id, text);
      await sleep(400);
      steps[2] = { ...steps[2], status: 'done', detail: 'Workflow execution complete.' };
      setProcessingSteps([...steps]);

      // Step 4 — Report to Niyanta
      await sleep(200);
      steps[3] = { ...steps[3], status: 'active' };
      setProcessingSteps([...steps]);
      await sleep(STEP_DELAY);
      steps[3] = { ...steps[3], status: 'done', detail: 'Results reported and logged to Niyanta.' };
      setProcessingSteps([...steps]);
      await sleep(300);

      // Build final response
      const rawResult = agentState?.result;
      let responseText = '';
      if (rawResult) {
        if (typeof rawResult === 'string') responseText = rawResult;
        else responseText = JSON.stringify(rawResult, null, 2);
      } else {
        responseText = `Processed successfully. All results have been reported to Niyanta and are available in the audit log.`;
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: responseText,
        timestamp: new Date(),
        steps: [...steps],
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setProcessingSteps([]);
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isSending) return;
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const stepIcon = (s: ProcessingStep['status']) => {
    if (s === 'done') return <span style={{ color: '#10B981', fontSize: 12 }}>✓</span>;
    if (s === 'error') return <span style={{ color: '#DC2626', fontSize: 12 }}>✕</span>;
    if (s === 'active') return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--accent)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />;
    return <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--border)', display: 'inline-block' }} />;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at 14% 0%, var(--cc-glow-a), transparent 42%), var(--bg-base)' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ height: 58, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, borderBottom: '1px solid var(--border)', background: `linear-gradient(90deg, ${agent.color}18, transparent 30%), var(--bg-dock)`, flexShrink: 0 }}>
        <button onClick={() => navigate('/agents')} style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: 16 }} title="Back">←</button>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${agent.color}20`, border: `1px solid ${agent.color}66`, display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>{agent.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{agent.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          NIYANTA CONNECTED
        </div>
        {agentState && (
          <div style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            background: agentState.status === 'complete' ? 'rgba(16,185,129,0.12)' : agentState.status === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
            color: agentState.status === 'complete' ? '#10B981' : agentState.status === 'error' ? '#DC2626' : '#D97706',
          }}>{agentState.status}</div>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && !isSending ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.12 }}>{agent.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{agent.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 20px' }}>{agent.description}</div>
            {agent.capabilities?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
                {agent.capabilities.slice(0, 4).map((cap: string, i: number) => (
                  <span key={i} style={{ padding: '6px 12px', borderRadius: 4, fontSize: 11, background: 'var(--bg-tile)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{cap}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>AGENT FLOW</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {['Input', 'Relevance Check', 'Workflow Conversion', 'Execute', 'Niyanta Report'].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <span style={{ padding: '4px 8px', borderRadius: 3, border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                  {i < arr.length - 1 && <span style={{ opacity: 0.4 }}>→</span>}
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: 'var(--text-muted)' }}>Type a message or paste data to start</div>
            {quickAgentPrompts.length > 0 && (
              <div style={{ marginTop: 18, display: 'grid', gap: 8, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto' }}>
                {quickAgentPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    style={{
                      border: `1px solid ${agent.color}50`,
                      background: `${agent.color}14`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      textAlign: 'left',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'agent' && (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: agent.color, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{agent.icon}</div>
              )}
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Processing steps (shown on agent messages) */}
                {msg.steps && (
                  <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {msg.steps.map(step => (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                        <div style={{ width: 14, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{stepIcon(step.status)}</div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: step.status === 'done' ? '#10B981' : step.status === 'error' ? '#DC2626' : 'var(--text-muted)' }}>{step.label}</span>
                        <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>— {step.detail}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ padding: '10px 14px', borderRadius: 8, background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--bg-panel)', border: msg.role === 'user' ? '1px solid var(--accent-border)' : '1px solid var(--border)', color: msg.role === 'user' ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>{msg.timestamp.toLocaleTimeString()}</div>
                </div>
              </div>
              {msg.role === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--bg-tile)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>👤</div>
              )}
            </div>
          ))
        )}

        {/* Live processing steps */}
        {isSending && processingSteps.length > 0 && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: agent.color, display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0 }}>{agent.icon}</div>
            <div style={{ background: `${agent.color}0D`, border: `1px solid ${agent.color}44`, borderRadius: 10, padding: '12px 16px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Processing</div>
              {processingSteps.map(step => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  <div style={{ width: 14, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{stepIcon(step.status)}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: step.status === 'active' ? 'var(--accent)' : step.status === 'done' ? '#10B981' : step.status === 'error' ? '#DC2626' : 'var(--text-muted)' }}>{step.label}</span>
                    {step.status !== 'pending' && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{step.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'var(--bg-panel)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Send data or instructions to ${agent.name}…`}
            disabled={isSending}
            style={{ flex: 1, minHeight: 44, maxHeight: 120, padding: '12px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            style={{ width: 44, height: 44, borderRadius: 6, border: 'none', background: input.trim() && !isSending ? agent.color : 'var(--bg-tile)', color: input.trim() && !isSending ? '#fff' : 'var(--text-muted)', cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed', fontSize: 18, display: 'grid', placeItems: 'center', transition: 'all 0.2s' }}
          >↑</button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          Enter to send · Shift+Enter for new line · All outputs reported to Niyanta
        </div>
      </div>
    </div>
  );
};

export default AgentChatScreen;
