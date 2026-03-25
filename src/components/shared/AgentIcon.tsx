import React from 'react';
import { Agent } from '../../types';

type IconSize = 'sm' | 'md' | 'lg';

interface AgentIconProps {
  agent: Agent;
  size?: IconSize;
  isProcessing?: boolean;
}

const SIZES: Record<IconSize, number> = {
  sm: 28,
  md: 40,
  lg: 56,
};

const AgentIcon: React.FC<AgentIconProps> = ({ agent, size = 'md', isProcessing = false }) => {
  const dimension = SIZES[size];
  const fontSize = Math.round(dimension * 0.45);

  const containerStyle: React.CSSProperties = {
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

  const letterStyle: React.CSSProperties = {
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
};

export default AgentIcon;
