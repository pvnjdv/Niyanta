import React from 'react';
import AgentIcon from '../shared/AgentIcon';
import Badge from '../shared/Badge';
import { AGENTS } from '../../constants/agents';

function formatTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DecisionCard({ entry }) {
  const agent = AGENTS[entry.agentId];

  const cardStyle = {
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '12px 14px',
    marginBottom: 8,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const agentNameStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: agent?.color || 'var(--text-muted)',
    flex: 1,
  };

  const timestampStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
  };

  const decisionRowStyle = {
    margin: '8px 0',
  };

  const reasonStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    lineHeight: 1.5,
  };

  const getDecisionType = (decision) => {
    if (!decision) return 'muted';
    const d = decision.toUpperCase();
    if (d === 'AUTO-APPROVE' || d === 'PROCEED') return 'success';
    if (d === 'FLAG' || d === 'HOLD' || d === 'ESCALATE') return 'warning';
    if (d === 'REJECT' || d === 'CRITICAL' || d === 'ERROR') return 'danger';
    if (d === 'HIGH') return 'warning';
    if (d === 'MEDIUM') return 'info';
    return 'muted';
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        {agent && <AgentIcon agent={agent} size="sm" />}
        <span style={agentNameStyle}>{agent?.name || entry.agentId}</span>
        <span style={timestampStyle}>{formatTime(entry.timestamp)}</span>
      </div>
      <div style={decisionRowStyle}>
        <Badge
          text={entry.decision}
          type={getDecisionType(entry.decision)}
          size="md"
        />
      </div>
      <div style={reasonStyle}>{entry.message}</div>
    </div>
  );
}
