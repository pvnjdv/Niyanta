import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/message';

interface NiyantaAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  messages: ChatMessage[];
}

const NiyantaAIPanel: React.FC<NiyantaAIPanelProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
  messages,
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    await onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: 'var(--bg-panel)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 14,
            color: 'var(--text-primary)',
            letterSpacing: '0.08em',
          }}
        >
          NIYANTA AI
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            padding: '1px 5px',
            borderRadius: 2,
          }}
        >
          Ctrl+K
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>◈</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Niyanta AI Assistant
            </div>
            <div>
              Ask about agents, workflows, operations, or request actions.
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: 4,
                background: msg.role === 'user' ? 'var(--bg-tile)' : 'var(--bg-input)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {msg.content}
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--text-muted)',
                marginTop: 4,
                padding: '0 2px',
              }}
            >
              {msg.role === 'user' ? 'You' : 'Niyanta'}
            </span>
          </div>
        ))}

        {isSending && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 0',
              color: 'var(--text-muted)',
              fontSize: 12,
            }}
          >
            <span style={{ animation: 'pulse 1.5s infinite' }}>●</span>
            <span style={{ animation: 'pulse 1.5s infinite 0.2s' }}>●</span>
            <span style={{ animation: 'pulse 1.5s infinite 0.4s' }}>●</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: 12,
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Niyanta AI..."
            rows={1}
            style={{
              flex: 1,
              minHeight: 36,
              maxHeight: 120,
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-primary)',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.4,
            }}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: input.trim() ? 'var(--accent-dim)' : 'transparent',
              color: input.trim() ? 'var(--accent)' : 'var(--text-muted)',
              cursor: input.trim() ? 'pointer' : 'default',
              display: 'grid',
              placeItems: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            ▸
          </button>
        </div>
      </div>
    </div>
  );
};

export default NiyantaAIPanel;
