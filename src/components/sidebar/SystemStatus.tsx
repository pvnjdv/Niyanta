import React from 'react';

interface SystemStatusProps {
  metrics: Record<string, unknown>;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ metrics }) => (
  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Space Mono, monospace' }}>
    STATUS OPERATIONAL · RUNS {String(metrics.totalWorkflowsRun || 0)}
  </div>
);

export default SystemStatus;
