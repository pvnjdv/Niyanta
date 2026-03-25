import React from 'react';
import Badge from '../shared/Badge';
import { AGENTS } from '../../constants/agents';

function formatTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AuditEntry({ entry, isNew }) {
  const agent = AGENTS[entry.agentId];

  const containerStyle = {
    display: 'flex',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid var(--border-light)',
    animation: isNew ? 'slideInTop 0.3s ease' : 'none',
    cursor: 'default',
    transition: 'background-color 0.15s ease',
  };

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: agent?.color || 'var(--text-muted)',
    flexShrink: 0,
    marginTop: 4,
  };

  const contentStyle = {
    flex: 1,
    minWidth: 0,
  };

  const headerRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  };

  const agentNameStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    color: agent?.color || 'var(--text-muted)',
    letterSpacing: '0.05em',
  };

  const timestampStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
  };

  const messageStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: entry.decision ? 6 : 0,
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
    <div style={containerStyle}>
      <div style={dotStyle} />
      <div style={contentStyle}>
        <div style={headerRowStyle}>
          <span style={agentNameStyle}>{agent?.name || entry.agentId}</span>
          <span style={timestampStyle}>{formatTime(entry.timestamp)}</span>
        </div>
        <div style={messageStyle}>{entry.message}</div>
        {entry.decision && (
          <Badge
            text={entry.decision}
            type={getDecisionType(entry.decision)}
            size="sm"
          />
        )}
      </div>
    </div>
  );
}
