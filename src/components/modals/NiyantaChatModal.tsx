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

const NiyantaChatModal: React.FC<NiyantaChatModalProps> = ({ isOpen, onClose, onSend, isSending, messages }) => {
  const [text, setText] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
      <div style={{ width: 'min(700px, 95vw)', height: 'min(600px, 88vh)', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', animation: 'fadeIn .2s ease' }}>
        <div style={{ height: 54, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
          <strong>NIYANTA · COMMAND</strong>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>Close</button>
        </div>
        <div ref={ref} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map((m, i) => <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', borderLeft: m.role === 'assistant' ? '2px solid var(--accent)' : undefined, background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: 8, maxWidth: '85%' }}>{m.content}</div>)}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', padding: 10, display: 'flex', gap: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask NIYANTA..." style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '8px 10px' }} />
          <button disabled={!text.trim() || isSending} onClick={async () => { if (text.trim()) { await onSend(text.trim()); setText(''); } }} style={{ border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 8, padding: '8px 10px' }}>{isSending ? '...' : 'Send'}</button>
        </div>
      </div>
    </div>
  );
};

export default NiyantaChatModal;
