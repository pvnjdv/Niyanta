import React, { useState } from 'react';
import AgentIcon from '../shared/AgentIcon';

export default function ChatHeader({ agent, agentState, onRun, onUseSample }) {
  const [sampleHovered, setSampleHovered] = useState(false);
  const [executeHovered, setExecuteHovered] = useState(false);

  const containerStyle = {
    height: 56,
    padding: '0 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const leftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  };

  const infoStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };

  const nameStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--text-primary)',
  };

  const getStatusText = () => {
    switch (agentState.status) {
      case 'idle':
        return { text: 'Ready to process', color: 'var(--text-muted)' };
      case 'processing':
        return { text: 'Processing...', color: agent.color };
      case 'complete':
        return {
          text: `${agentState.taskCount} tasks extracted`,
          color: 'var(--green)',
        };
      case 'error':
        return { text: 'Error — click to retry', color: 'var(--red)' };
      default:
        return { text: 'Ready', color: 'var(--text-muted)' };
    }
  };

  const status = getStatusText();

  const statusStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: status.color,
  };

  const rightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const sampleButtonStyle = {
    height: 32,
    padding: '0 12px',
    backgroundColor: sampleHovered ? 'var(--bg-hover)' : 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const executeButtonStyle = {
    height: 32,
    padding: '0 16px',
    backgroundColor: executeHovered
      ? `color-mix(in srgb, ${agent.color} 30%, transparent)`
      : `color-mix(in srgb, ${agent.color} 20%, transparent)`,
    border: `1px solid ${agent.color}`,
    borderRadius: 4,
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: agent.color,
    cursor: agentState.status === 'processing' ? 'not-allowed' : 'pointer',
    opacity: agentState.status === 'processing' ? 0.6 : 1,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  const spinnerStyle = {
    width: 12,
    height: 12,
    border: `2px solid ${agent.color}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  return (
    <div style={containerStyle}>
      <div style={leftStyle}>
        <AgentIcon
          agent={agent}
          size="md"
          isProcessing={agentState.status === 'processing'}
        />
        <div style={infoStyle}>
          <div style={nameStyle}>{agent.name}</div>
          <div style={statusStyle}>{status.text}</div>
        </div>
      </div>
      <div style={rightStyle}>
        <button
          style={sampleButtonStyle}
          onClick={onUseSample}
          onMouseEnter={() => setSampleHovered(true)}
          onMouseLeave={() => setSampleHovered(false)}
          disabled={agentState.status === 'processing'}
        >
          USE SAMPLE
        </button>
        <button
          style={executeButtonStyle}
          onClick={onRun}
          onMouseEnter={() => setExecuteHovered(true)}
          onMouseLeave={() => setExecuteHovered(false)}
          disabled={agentState.status === 'processing'}
        >
          {agentState.status === 'processing' && <div style={spinnerStyle} />}
          EXECUTE
        </button>
      </div>
    </div>
  );
}
