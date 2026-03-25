import React from 'react';

const SIZES = {
  sm: 28,
  md: 40,
  lg: 56,
};

export default function AgentIcon({ agent, size = 'md', isProcessing = false }) {
  const dimension = SIZES[size];
  const fontSize = Math.round(dimension * 0.45);

  const containerStyle = {
    width: dimension,
    height: dimension,
    minWidth: dimension,
    borderRadius: '50%',
    backgroundColor: agent.glow,
    border: `1px solid ${agent.color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: isProcessing ? `0 0 12px ${agent.glow}` : 'none',
    animation: isProcessing ? 'pulse 2s ease-in-out infinite' : 'none',
  };

  const letterStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize,
    color: agent.color,
    lineHeight: 1,
  };

  return (
    <div style={containerStyle}>
      <span style={letterStyle}>{agent.icon}</span>
    </div>
  );
}
