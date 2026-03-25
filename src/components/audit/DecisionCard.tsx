import React from 'react';
import AgentIcon from '../shared/AgentIcon';
import Badge from '../shared/Badge';
import { AGENTS } from '../../constants/agents';
import { AuditEntry } from '../../types';

interface DecisionCardProps {
  entry: AuditEntry;
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const DecisionCard: React.FC<DecisionCardProps> = ({ entry }) => {
  const agent = AGENTS[entry.agentId];

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    borderRadius: 2,
    padding: '12px 14px',
    marginBottom: 8,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const agentNameStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: agent?.color || 'var(--text-muted)',
    flex: 1,
  };

  const timestampStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
  };

  const decisionRowStyle: React.CSSProperties = {
    margin: '8px 0',
  };

  const reasonStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    lineHeight: 1.5,
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
    <div style={cardStyle}>
      <div style={headerStyle}>
        {agent && <AgentIcon agent={agent} size="sm" />}
        <span style={agentNameStyle}>{agent?.name || entry.agentId}</span>
        <span style={timestampStyle}>{formatTime(entry.timestamp)}</span>
      </div>
      <div style={decisionRowStyle}>
        <Badge
          text={entry.decision || ''}
          type={getDecisionType(entry.decision)}
          size="md"
        />
      </div>
      <div style={reasonStyle}>{entry.message}</div>
    </div>
  );
};

export default DecisionCard;
