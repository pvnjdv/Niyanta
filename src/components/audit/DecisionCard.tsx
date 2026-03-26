import React from 'react';

const DecisionCard: React.FC<{ entry: Record<string, unknown> }> = ({ entry }) => (
  <div style={{ borderLeft: '3px solid var(--accent)', padding: '8px 10px', background: 'var(--bg-hover)', borderRadius: 6 }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(entry.agent_id || 'agent')}</div>
    <div style={{ fontSize: 12, fontWeight: 700 }}>{String(entry.decision || 'N/A')}</div>
  </div>
);

export default DecisionCard;
