import React from 'react';
import Badge from '../shared/Badge';
import { AGENTS } from '../../constants/agents';
import { AuditEntry as AuditEntryType } from '../../types';

interface AuditEntryProps {
  entry: AuditEntryType;
  isNew?: boolean;
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const AuditEntry: React.FC<AuditEntryProps> = ({ entry, isNew }) => {
  const agent = AGENTS[entry.agentId];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid var(--border-light)',
    animation: isNew ? 'slideInTop 0.3s ease' : 'none',
    cursor: 'default',
    transition: 'background-color 0.15s ease',
  };

  const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: agent?.color || 'var(--text-muted)',
    flexShrink: 0,
    marginTop: 4,
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const headerRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  };

  const agentNameStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    textTransform: 'uppercase',
    color: agent?.color || 'var(--text-muted)',
    letterSpacing: '0.05em',
  };

  const timestampStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
  };

  const messageStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: entry.decision ? 6 : 0,
  };

  const getDecisionType = (decision: string | null): 'success' | 'warning' | 'danger' | 'info' | 'muted' => {
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
};

export default AuditEntry;
