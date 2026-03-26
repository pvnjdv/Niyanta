import React from 'react';

const MetricsGrid: React.FC<{ metrics: Record<string, unknown> }> = ({ metrics }) => {
  const rows: Array<[string, unknown]> = [
    ['Total Runs', metrics.totalWorkflowsRun || 0],
    ['Tasks', metrics.totalTasksCreated || 0],
    ['Decisions', metrics.totalDecisionsMade || 0],
    ['Escalations', metrics.escalationsTriggered || 0],
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, animation: 'countUp .2s ease' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{String(value)}</div>
        </div>
      ))}
    </div>
  );
};

export default MetricsGrid;
