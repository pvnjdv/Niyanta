import React, { useState } from 'react';
import AgentIcon from '../shared/AgentIcon';
import { Agent, AgentState } from '../../types';

interface AgentRowProps {
  agent: Agent;
  agentState: AgentState;
  isSelected: boolean;
  onClick: () => void;
}

function formatTimeAgo(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '';
  const now = new Date();
  const then = new Date(isoTimestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return then.toLocaleDateString();
}

const AgentRow: React.FC<AgentRowProps> = ({ agent, agentState, isSelected, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    height: 64,
    padding: '0 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    backgroundColor: isSelected
      ? 'var(--bg-active)'
      : isHovered
      ? 'var(--bg-hover)'
      : 'transparent',
    transition: 'background-color 0.15s ease',
    borderLeft: isSelected ? `3px solid ${agent.color}` : '3px solid transparent',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const topRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 14,
    color: 'var(--text-primary)',
  };

  const timeStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: 'var(--text-muted)',
  };

  const subtitleStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const rightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const taskCountStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    padding: '2px 6px',
    borderRadius: 10,
    backgroundColor: agent.glow,
    color: agent.color,
  };

  const statusDotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor:
      agentState.status === 'idle'
        ? 'var(--text-muted)'
        : agentState.status === 'processing'
        ? agent.color
        : agentState.status === 'complete'
        ? agent.color
        : 'var(--red)',
    boxShadow:
      agentState.status === 'processing' ? `0 0 8px ${agent.glow}` : 'none',
    animation:
      agentState.status === 'processing'
        ? 'pulse 1.5s ease-in-out infinite'
        : 'none',
  };

  const result = agentState.result as { summary?: string } | null;
  const lastMessage =
    agentState.messages.length > 0
      ? result?.summary || agent.subtitle
      : agent.subtitle;

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AgentIcon
        agent={agent}
        size="md"
        isProcessing={agentState.status === 'processing'}
      />
      <div style={contentStyle}>
        <div style={topRowStyle}>
          <span style={nameStyle}>{agent.name}</span>
          <span style={timeStyle}>{formatTimeAgo(agentState.lastActivity)}</span>
        </div>
        <div style={subtitleStyle}>{lastMessage}</div>
      </div>
      <div style={rightStyle}>
        {agentState.taskCount > 0 && (
          <span style={taskCountStyle}>{agentState.taskCount}</span>
        )}
        <div style={statusDotStyle} />
      </div>
    </div>
  );
};

export default AgentRow;
