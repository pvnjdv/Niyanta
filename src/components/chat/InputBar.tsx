import React, { useMemo, useState } from 'react';
import { Agent } from '../../types/agent';

interface InputBarProps {
  agent: Agent;
  onSend: (text: string) => void;
  onUseSample: () => void;
  disabled: boolean;
}

const PLACEHOLDERS: Record<string, string> = {
  meeting: 'Paste meeting transcript...',
  invoice: 'Paste invoice text...',
  hr: 'Enter employee onboarding details...',
  procurement: 'Enter procurement request...',
  security: 'Describe security incident...',
  compliance: 'Paste policy/compliance review request...',
  document: 'Paste document text for classification...',
  monitoring: 'Paste ops monitoring report...',
  workflow: 'Describe workflow execution data...',
  it_ops: 'Describe IT request or incident...',
};

const InputBar: React.FC<InputBarProps> = ({ agent, onSend, onUseSample, disabled }) => {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const placeholder = useMemo(() => PLACEHOLDERS[agent.id] || `Ask ${agent.name}...`, [agent.id, agent.name]);

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-end', position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>📎</button>
      {open && (
        <button onClick={() => { onUseSample(); setOpen(false); }} style={{ position: 'absolute', bottom: 52, left: 16, zIndex: 10, border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 8, padding: '8px 10px' }}>
          📋 Use Sample Data
        </button>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = '40px';
          target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }
        }}
        style={{ flex: 1, minHeight: 40, maxHeight: 160, resize: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 14px' }}
      />
      <button
        disabled={!text.trim() || disabled}
        onClick={() => {
          if (text.trim()) {
            onSend(text.trim());
            setText('');
          }
        }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: text.trim() ? agent.color : 'var(--accent-dim)', color: '#001015', transform: text.trim() ? 'scale(1)' : 'scale(.96)' }}
      >
        {disabled ? <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,.35)', borderTopColor: 'rgba(0,0,0,.8)', animation: 'spin .8s linear infinite' }} /> : '➤'}
      </button>
    </div>
  );
};

export default InputBar;
