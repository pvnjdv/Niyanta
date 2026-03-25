import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { AGENT_PLACEHOLDERS } from '../../constants/agents';
import { Agent } from '../../types';

interface InputBarProps {
  agent: Agent;
  onSend: (text: string) => void;
  onUseSample: () => void;
  disabled: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ agent, onSend, onUseSample, disabled }) => {
  const [value, setValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue('');
    }
  };

  const handleUseSampleClick = () => {
    onUseSample();
    setShowDropdown(false);
  };

  const containerStyle: React.CSSProperties = {
    borderTop: '1px solid var(--border)',
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: 10,
  };

  const attachContainerStyle: React.CSSProperties = {
    position: 'relative',
  };

  const attachButtonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 16,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    marginBottom: 8,
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    padding: 8,
    minWidth: 160,
    boxShadow: '0 4px 12px var(--shadow)',
    zIndex: 10,
  };

  const dropdownItemStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'pointer',
    borderRadius: 2,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'background-color 0.15s ease',
  };

  const textareaStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 40,
    maxHeight: 160,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '10px 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: 'var(--text-primary)',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.5,
  };

  const hasText = value.trim().length > 0;

  const sendButtonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    backgroundColor: hasText ? agent.color : 'var(--accent-dim)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: hasText && !disabled ? 'pointer' : 'not-allowed',
    opacity: hasText ? 1 : 0.5,
    transition: 'all 0.15s ease',
    transform: sendHovered && hasText ? 'scale(1.05)' : 'scale(1)',
  };

  const arrowStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    color: hasText ? '#000' : 'var(--text-muted)',
  };

  const spinnerStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    border: '2px solid #000',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={attachContainerStyle}>
        <button
          style={attachButtonStyle}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          📎
        </button>
        {showDropdown && (
          <div style={dropdownStyle}>
            <div
              style={dropdownItemStyle}
              onClick={handleUseSampleClick}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = 'var(--bg-hover)')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.backgroundColor = 'transparent')
              }
            >
              📋 Use Sample Data
            </div>
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        style={textareaStyle}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={AGENT_PLACEHOLDERS[agent.id]}
        disabled={disabled}
      />
      <button
        style={sendButtonStyle}
        onClick={handleSend}
        onMouseEnter={() => setSendHovered(true)}
        onMouseLeave={() => setSendHovered(false)}
        disabled={!hasText || disabled}
      >
        {disabled ? (
          <div style={spinnerStyle} />
        ) : (
          <svg style={arrowStyle} viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default InputBar;
