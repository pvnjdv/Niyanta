import React, { useState } from 'react';
import { Agent } from '../../types/agent';

interface InputBarProps {
  agent: Agent;
  onSend: (text: string) => void;
  onUseSample: () => void;
  disabled: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ agent, onSend, onUseSample, disabled }) => {
  const [text, setText] = useState('');

  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <button onClick={onUseSample} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>📋</button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Ask ${agent.name}...`}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) {
              onSend(text.trim());
              setText('');
            }
          }
        }}
        style={{ flex: 1, minHeight: 40, maxHeight: 140, resize: 'none', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', padding: '10px 12px' }}
      />
      <button
        disabled={!text.trim() || disabled}
        onClick={() => {
          if (text.trim()) {
            onSend(text.trim());
            setText('');
          }
        }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: text.trim() ? agent.color : 'var(--accent-dim)', color: '#001015' }}
      >
        ➤
      </button>
    </div>
  );
};

export default InputBar;
