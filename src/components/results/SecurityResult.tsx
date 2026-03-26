import React from 'react';

const SecurityResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12, borderLeft: `3px solid ${String(result.severity) === 'CRITICAL' ? 'var(--red)' : 'var(--amber)'}`, paddingLeft: 8 }}>
    <strong>Severity:</strong> {String(result.severity || 'N/A')}
  </div>
);

export default SecurityResult;
