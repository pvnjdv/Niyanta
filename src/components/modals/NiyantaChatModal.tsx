import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AgentState } from '../../types/agent';

interface NiyantaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentStates: Record<string, AgentState>;
}

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

const SUGGESTIONS = [
  { icon: '📊', label: 'Cross-workflow risk report' },
  { icon: '⚠️', label: 'Pending escalations' },
  { icon: '🔍', label: 'Workflow bottlenecks' },
  { icon: '◉', label: 'Agent statuses' },
  { icon: '✓', label: 'SLA compliance' },
];

const NiyantaChatModal: React.FC<NiyantaChatModalProps> = ({ isOpen, onClose, onSend, isSending, messages }) => {
  const [text, setText] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSend = async () => {
    if (text.trim() && !isSending) {
      await onSend(text.trim());
      setText('');
      adjustHeight(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeScale 180ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 92vw)',
          height: 'min(680px, 85vh)',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 56,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid var(--accent)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--accent)',
              }}
            >
              नि
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.05em',
                }}
              >
                NIYANTA AI
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--text-muted)',
                }}
              >
                Powered by Llama 3.3 70B
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tile-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ESC
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                padding: '64px 0',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '3px solid var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 36,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                }}
              >
                नि
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                What can I help you orchestrate?
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  maxWidth: 480,
                  lineHeight: 1.6,
                }}
              >
                Ask for cross-workflow insights, risk reports, operational summaries,
                or command any agent in your ecosystem.
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: 12,
                background:
                  m.role === 'user' ? 'var(--accent-dim)' : 'var(--bg-tile)',
                border:
                  m.role === 'user'
                    ? '1px solid var(--accent-border)'
                    : '1px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)',
              }}
            >
              {m.role === 'assistant' && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--accent)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ⚡ NIYANTA
                </div>
              )}
              {m.content}
            </div>
          ))}

          {isSending && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: 'var(--bg-tile)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                alignSelf: 'flex-start',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  animation: 'accentPulse 1.5s infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                Processing...
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: 24,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 700,
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'var(--bg-dock)',
                borderRadius: 16,
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowY: 'auto' }}>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Niyanta anything..."
                  style={{
                    width: '100%',
                    padding: '16px 16px',
                    resize: 'none',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    minHeight: 60,
                    overflow: 'hidden',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontFamily: 'var(--font-body)',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tile-hover)';
                      e.currentTarget.style.borderColor = 'var(--accent-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <span style={{ fontSize: 14 }}>📎</span>
                    <span>Attach</span>
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: 'transparent',
                      border: '1px dashed var(--border)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontFamily: 'var(--font-body)',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tile-hover)';
                      e.currentTarget.style.borderColor = 'var(--accent-border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <span style={{ fontSize: 14 }}>+</span>
                    <span>Context</span>
                  </button>

                  <button
                    type="button"
                    disabled={!text.trim() || isSending}
                    onClick={handleSend}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: text.trim() && !isSending ? 'var(--accent)' : 'var(--bg-tile)',
                      border: text.trim() && !isSending ? '1px solid var(--accent-border)' : '1px solid var(--border)',
                      cursor: text.trim() && !isSending ? 'pointer' : 'not-allowed',
                      color: text.trim() && !isSending ? 'var(--bg-base)' : 'var(--text-muted)',
                      transition: 'all 150ms ease',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>↑</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {messages.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 16,
                  flexWrap: 'wrap',
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      setText(s.label);
                      adjustHeight();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: 'var(--bg-dock)',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tile-hover)';
                      e.currentTarget.style.borderColor = 'var(--accent-border)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--bg-dock)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NiyantaChatModal;
