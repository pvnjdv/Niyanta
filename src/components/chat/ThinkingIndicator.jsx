import React from 'react';

export default function ThinkingIndicator({ agent }) {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    animation: 'slideInBottom 0.25s ease',
  };

  const bubbleStyle = {
    maxWidth: '80%',
    backgroundColor: 'var(--bg-msg-in)',
    borderLeft: `3px solid ${agent.color}`,
    borderRadius: '2px 12px 12px 12px',
    padding: '14px 16px',
  };

  const dotsContainerStyle = {
    display: 'flex',
    gap: 6,
    marginBottom: 8,
  };

  const dotStyle = (delay) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: agent.color,
    animation: 'blink 1.4s ease-in-out infinite',
    animationDelay: delay,
  });

  const textStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: 'var(--text-muted)',
  };

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>
        <div style={dotsContainerStyle}>
          <div style={dotStyle('0s')} />
          <div style={dotStyle('0.2s')} />
          <div style={dotStyle('0.4s')} />
        </div>
        <div style={textStyle}>Niyanta agent is processing...</div>
      </div>
    </div>
  );
}
