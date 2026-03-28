import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';

interface AgentChatScreenProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  onExecuteAgent: (id: string, input?: string) => Promise<void>;
}

const AgentChatScreen: React.FC<AgentChatScreenProps> = ({
  agents,
  agentStates,
  onExecuteAgent,
}) => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; content: string; timestamp: Date }>>([]);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agent = agents.find(a => a.id === agentId);
  const agentState = agentId ? agentStates[agentId] : null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!agent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Agent not found</div>
          <button
            onClick={() => navigate('/agents')}
            style={{
              marginTop: 16, height: 36, padding: '0 20px', borderRadius: 4,
              background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
              color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            Back to Agents
          </button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    // Add user message
    const userMsg = { role: 'user' as const, content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      // Execute agent
      await onExecuteAgent(agent.id, text);
      
      // Add agent response
      const response = agentState?.result 
        ? JSON.stringify(agentState.result, null, 2)
        : 'Agent executed successfully.';
      
      const agentMsg = { role: 'agent' as const, content: response, timestamp: new Date() };
      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      const errorMsg = { 
        role: 'agent' as const, 
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Header */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 12,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-dock)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate('/agents')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
          }}
          title="Back to Agents"
        >
          ←
        </button>

        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: agent.color,
            display: 'grid',
            placeItems: 'center',
            fontSize: 16,
            boxShadow: `0 2px 8px ${agent.glow}`,
            flexShrink: 0,
          }}
        >
          {agent.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {agent.subtitle}
          </div>
        </div>

        {agentState && (
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              background:
                agentState.status === 'complete'
                  ? 'rgba(0, 255, 136, 0.1)'
                  : agentState.status === 'error'
                    ? 'rgba(255, 68, 68, 0.1)'
                    : 'rgba(255, 165, 0, 0.1)',
              color:
                agentState.status === 'complete'
                  ? '#00ff88'
                  : agentState.status === 'error'
                    ? '#ff4444'
                    : '#ffa500',
            }}
          >
            {agentState.status}
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.15 }}>{agent.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{agent.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              {agent.description}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {agent.capabilities.slice(0, 4).map((cap, i) => (
                <span
                  key={i}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    background: 'var(--bg-tile)',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Type a message to start interacting with this agent
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.role === 'agent' && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: agent.color,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {agent.icon}
                </div>
              )}
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--bg-panel)',
                  border: msg.role === 'user' ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                  color: msg.role === 'user' ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {msg.content}
                <div
                  style={{
                    fontSize: 10,
                    color: 'var(--text-muted)',
                    marginTop: 8,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {msg.role === 'user' && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: 'var(--bg-tile)',
                    border: '1px solid var(--border)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  👤
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: agent.color,
                display: 'grid',
                placeItems: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {agent.icon}
            </div>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              <span className="thinking-dots">●●●</span> Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 20px',
          background: 'var(--bg-panel)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.name}...`}
            disabled={isSending}
            style={{
              flex: 1,
              minHeight: 44,
              maxHeight: 120,
              padding: '12px 14px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              resize: 'none',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 6,
              border: 'none',
              background: input.trim() && !isSending ? 'var(--accent)' : 'var(--bg-tile)',
              color: input.trim() && !isSending ? '#fff' : 'var(--text-muted)',
              cursor: input.trim() && !isSending ? 'pointer' : 'not-allowed',
              fontSize: 18,
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default AgentChatScreen;
