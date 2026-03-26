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
    <div className="nyt-modal-overlay" onClick={onClose}>
      <div
        className="nyt-modal"
        style={{ width: 'min(680px, 92vw)', height: 'min(560px, 85vh)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="nyt-modal__header">
          <div className="nyt-modal__title">Niyanta Command</div>
          <button className="nyt-btn nyt-btn--ghost nyt-btn--sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={ref} className="nyt-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                Niyanta AI
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', maxWidth: 400 }}>
                Ask the orchestrator for cross-workflow insights, risk reports, or operational summaries.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="nyt-btn nyt-btn--sm"
                    onClick={() => setText(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? 'var(--bg-surface-raised)' : 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          ))}

          {isSending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
              <span className="nyt-spinner nyt-spinner--sm" />
              Thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="nyt-modal__footer" style={{ gap: 10 }}>
          <input
            className="nyt-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask Niyanta..."
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim() && !isSending) {
                void onSend(text.trim());
                setText('');
              }
            }}
          />
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            llama-3.3-70b
          </span>
          <button
            className="nyt-btn nyt-btn--primary nyt-btn--sm"
            disabled={!text.trim() || isSending}
            onClick={async () => {
              if (text.trim()) {
                await onSend(text.trim());
                setText('');
              }
            }}
          >
            {isSending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NiyantaChatModal;
