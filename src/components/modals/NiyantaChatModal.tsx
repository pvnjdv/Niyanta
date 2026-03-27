import React, { useEffect, useRef, useState } from 'react';
import { AgentState } from '../../types/agent';

interface NiyantaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  isSending: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  agentStates: Record<string, AgentState>;
}

const SUGGESTIONS = [
  'Cross-workflow risk report',
  'Summarize pending escalations',
  'Top bottlenecks across workflows',
  'Show all active agent statuses',
  'SLA compliance summary',
];

const NiyantaChatModal: React.FC<NiyantaChatModalProps> = ({ isOpen, onClose, onSend, isSending, messages }) => {
  const [text, setText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeScale 180ms ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(700px, 92vw)', height: 'min(580px, 85vh)',
          background: 'var(--bg-panel)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          height: 48, borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--green-primary)' }}>⚡</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>Niyanta Command</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green-primary)' }}>AI</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>llama-3.3-70b</span>
            <button onClick={onClose} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', padding: '4px 8px', border: '1px solid var(--border)' }}>ESC</button>
          </div>
        </div>

        {/* Messages */}
        <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 0' }}>
              <div style={{ fontSize: 36, opacity: 0.3 }}>⚡</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>NIYANTA AI</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 420, lineHeight: 1.6 }}>
                Ask the orchestrator for cross-workflow insights, risk reports, or operational summaries.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setText(s)}
                    style={{
                      padding: '6px 14px', background: 'var(--bg-tile)', border: '1px solid var(--border)',
                      fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-primary)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--green-border)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%', padding: '10px 14px',
                background: m.role === 'user' ? 'var(--bg-tile)' : 'var(--bg-panel)',
                border: m.role === 'user' ? '1px solid var(--green-border)' : '1px solid var(--border)',
                fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)', marginBottom: 4, textTransform: 'uppercase' }}>NIYANTA</div>
              )}
              {m.content}
            </div>
          ))}

          {isSending && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'var(--bg-panel)', border: '1px solid var(--border)', alignSelf: 'flex-start',
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--green-primary)', animation: 'greenPulse 1s infinite' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>Processing...</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          height: 52, borderTop: '1px solid var(--border)', display: 'flex',
          alignItems: 'center', padding: '0 12px', gap: 10,
        }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Ask Niyanta..."
            style={{ flex: 1, height: 34, border: '1px solid var(--border)', padding: '0 12px', fontFamily: 'var(--font-body)', fontSize: 13 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && text.trim() && !isSending) {
                void onSend(text.trim());
                setText('');
              }
            }}
          />
          <button
            disabled={!text.trim() || isSending}
            onClick={async () => {
              if (text.trim()) {
                await onSend(text.trim());
                setText('');
              }
            }}
            style={{
              height: 34, padding: '0 16px', fontFamily: 'var(--font-mono)', fontSize: 11,
              textTransform: 'uppercase',
              background: text.trim() && !isSending ? 'var(--green-dim)' : 'transparent',
              border: text.trim() && !isSending ? '1px solid var(--green-border)' : '1px solid var(--border)',
              color: text.trim() && !isSending ? 'var(--green-primary)' : 'var(--text-muted)',
            }}
          >{isSending ? '...' : 'SEND'}</button>
        </div>
      </div>
    </div>
  );
};

export default NiyantaChatModal;
