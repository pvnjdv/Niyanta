import React, { useEffect, useRef } from 'react';
import { Agent, AgentState, Message } from '../../types/agent';
import AgentBubble from '../chat/AgentBubble';

interface CenterPanelProps {
  selectedAgent: Agent | null;
  selectedState: AgentState | null;
  onExecute: (agentId: string, input?: string) => Promise<void>;
  onUseSample: (agentId: string) => Promise<void>;
}

const CenterPanel: React.FC<CenterPanelProps> = ({ selectedAgent, selectedState, onExecute, onUseSample }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [selectedState?.messages]);

  if (!selectedAgent || !selectedState) {
    return (
      <div className="nyt-empty" style={{ height: '100%' }}>
        <div className="nyt-empty__icon">◉</div>
        <div className="nyt-empty__text">Select an agent</div>
        <div className="nyt-empty__sub">Choose an agent from the left panel to get started</div>
      </div>
    );
  }

  const handleSend = () => {
    const text = inputRef.current?.value?.trim();
    if (text) {
      void onExecute(selectedAgent.id, text);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isProcessing = selectedState.status === 'processing';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Agent Header */}
      <div style={{
        height: 56,
        borderBottom: '1px solid var(--border-default)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: `${selectedAgent.color}15`,
            border: `1px solid ${selectedAgent.color}30`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: selectedAgent.color,
            fontFamily: 'var(--font-mono)',
          }}>
            {selectedAgent.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedAgent.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              {isProcessing ? 'Processing...' :
               selectedState.status === 'complete' ? 'Execution complete' :
               selectedState.status === 'error' ? 'Error occurred' :
               'Ready'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="nyt-btn nyt-btn--sm"
            onClick={() => { void onUseSample(selectedAgent.id); }}
          >
            Use Sample
          </button>
          <button
            className="nyt-btn nyt-btn--primary nyt-btn--sm"
            onClick={() => { void onExecute(selectedAgent.id); }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="nyt-spinner nyt-spinner--sm" /> Running
              </span>
            ) : '▶ Execute'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {selectedState.messages.length === 0 && (
          <div className="nyt-empty" style={{ flex: 1 }}>
            <div className="nyt-empty__icon" style={{ fontSize: 32 }}>◉</div>
            <div className="nyt-empty__text">{selectedAgent.name}</div>
            <div className="nyt-empty__sub">{selectedAgent.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16, justifyContent: 'center' }}>
              {selectedAgent.capabilities.map((cap) => (
                <span key={cap} className="nyt-badge">{cap}</span>
              ))}
            </div>
          </div>
        )}

        {selectedState.messages.map((m: Message) => {
          if (m.type === 'user') {
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '75%',
                  background: 'var(--bg-surface-raised)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '12px 12px 4px 12px',
                  padding: '10px 14px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content.length > 300 ? m.content.substring(0, 300) + '...' : m.content}
              </div>
            );
          }

          if (m.type === 'agent') {
            return <AgentBubble key={m.id} message={m} agentId={selectedAgent.id} />;
          }

          if (m.type === 'insight') {
            return (
              <div
                key={m.id}
                style={{
                  borderLeft: '3px solid var(--color-info)',
                  background: 'var(--color-info-dim)',
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {m.content}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              style={{
                borderLeft: '3px solid var(--color-error)',
                background: 'var(--color-error-dim)',
                padding: '10px 14px',
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {m.content}
            </div>
          );
        })}

        {isProcessing && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--text-tertiary)',
          }}>
            <span className="nyt-spinner nyt-spinner--sm" />
            Agent processing...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div style={{
        borderTop: '1px solid var(--border-default)',
        padding: '12px 20px',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        background: 'var(--bg-surface)',
      }}>
        <textarea
          ref={inputRef}
          placeholder={`Ask ${selectedAgent.name}...`}
          disabled={isProcessing}
          className="nyt-textarea"
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            resize: 'none',
            padding: '10px 14px',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = '40px';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          className="nyt-btn nyt-btn--primary nyt-btn--icon"
          disabled={isProcessing}
          onClick={handleSend}
          style={{ width: 40, height: 40, borderRadius: 8, fontSize: 16 }}
        >
          {isProcessing ? <span className="nyt-spinner nyt-spinner--sm" /> : '↑'}
        </button>
      </div>
    </div>
  );
};

export default CenterPanel;
