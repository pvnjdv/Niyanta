import React from 'react';

const AuditEntry: React.FC<{ entry: Record<string, unknown> }> = ({ entry }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, animation: 'slideInTop .2s ease' }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(entry.timestamp || '')}</div>
    <div style={{ fontSize: 12 }}>{String(entry.event || '')}</div>
  </div>
);

export default AuditEntry;
