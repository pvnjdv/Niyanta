import React, { useState, useEffect, useRef } from 'react';
import { useNiyantaChat } from '../../hooks/useNiyantaChat';

export default function NiyantaChatModal({ agentStates, onClose }) {
  const { messages, isLoading, sendMessage } = useNiyantaChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    // Build agent results context
    const agentResults = {};
    Object.entries(agentStates).forEach(([id, state]) => {
      if (state.result) {
        agentResults[id] = state.result;
      }
    });

    sendMessage(input.trim(), agentResults);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const modalStyle = {
    width: 700,
    height: 600,
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    animation: 'scaleIn 0.2s ease',
  };

  const headerStyle = {
    height: 56,
    padding: '0 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const headerLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const logoStyle = {
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    border: '1px solid #00D4FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 10,
    color: '#00D4FF',
  };

  const titleStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--text-primary)',
  };

  const subtitleStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: 'var(--text-muted)',
  };

  const closeButtonStyle = {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 18,
    color: 'var(--text-muted)',
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
  };

  const userBubbleStyle = {
    maxWidth: '70%',
    alignSelf: 'flex-end',
    backgroundColor: 'var(--bg-msg-out)',
    border: '1px solid var(--border)',
    borderRadius: '12px 12px 2px 12px',
    padding: '10px 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
  };

  const assistantBubbleStyle = {
    maxWidth: '80%',
    alignSelf: 'flex-start',
    backgroundColor: 'var(--bg-msg-in)',
    borderLeft: '3px solid #00D4FF',
    borderRadius: '2px 12px 12px 12px',
    padding: '10px 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  };

  const thinkingStyle = {
    display: 'flex',
    gap: 6,
    alignSelf: 'flex-start',
    padding: '10px 14px',
    backgroundColor: 'var(--bg-msg-in)',
    borderLeft: '3px solid #00D4FF',
    borderRadius: '2px 12px 12px 12px',
  };

  const dotStyle = (delay) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: '#00D4FF',
    animation: 'blink 1.4s ease-in-out infinite',
    animationDelay: delay,
  });

  const inputAreaStyle = {
    flexShrink: 0,
    borderTop: '1px solid var(--border)',
    padding: '12px 16px',
  };

  const suggestedPromptsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  };

  const promptChipStyle = {
    padding: '6px 12px',
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const inputRowStyle = {
    display: 'flex',
    gap: 10,
  };

  const inputStyle = {
    flex: 1,
    height: 40,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '0 16px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
  };

  const sendButtonStyle = {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: input.trim() ? '#00D4FF' : 'var(--accent-dim)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
    opacity: input.trim() ? 1 : 0.5,
    transition: 'all 0.15s ease',
  };

  const suggestedPrompts = [
    'Status report across all agents',
    'Any cross-workflow risks?',
    'What needs immediate attention?',
  ];

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={headerLeftStyle}>
            <div style={logoStyle}>नि</div>
            <div>
              <div style={titleStyle}>NIYANTA · COMMAND</div>
              <div style={subtitleStyle}>
                Autonomous Enterprise Governor · Full situational awareness
              </div>
            </div>
          </div>
          <button style={closeButtonStyle} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={messagesStyle}>
          {messages.length === 0 ? (
            <div style={emptyStateStyle}>
              Ask Niyanta anything about your enterprise workflows
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={msg.role === 'user' ? userBubbleStyle : assistantBubbleStyle}
              >
                {msg.content}
              </div>
            ))
          )}
          {isLoading && (
            <div style={thinkingStyle}>
              <div style={dotStyle('0s')} />
              <div style={dotStyle('0.2s')} />
              <div style={dotStyle('0.4s')} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={inputAreaStyle}>
          {messages.length === 0 && (
            <div style={suggestedPromptsStyle}>
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  style={promptChipStyle}
                  onClick={() => handleSuggestedPrompt(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div style={inputRowStyle}>
            <input
              style={inputStyle}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Niyanta..."
              disabled={isLoading}
            />
            <button
              style={sendButtonStyle}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={input.trim() ? '#000' : 'var(--text-muted)'}
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
