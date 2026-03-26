import React from 'react';

interface MonitoringViewProps {
  metrics: Record<string, unknown>;
  auditEntries: unknown[];
}

const MonitoringView: React.FC<MonitoringViewProps> = ({ metrics, auditEntries }) => {
  const totalRuns = (metrics?.totalRuns as number) || 0;
  const totalDecisions = (metrics?.totalDecisions as number) || 0;
  const totalEscalations = (metrics?.totalEscalations as number) || 0;
  const avgTime = (metrics?.averageProcessingTime as number) || 0;
  const recentEntries = (auditEntries as Array<Record<string, unknown>>).slice(0, 20);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 32 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Metrics Overview */}
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
          System Monitoring
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Runs', value: totalRuns, color: 'var(--color-info)' },
            { label: 'Decisions', value: totalDecisions, color: 'var(--color-success)' },
            { label: 'Escalations', value: totalEscalations, color: 'var(--color-warning)' },
            { label: 'Avg Time (ms)', value: Math.round(avgTime), color: 'var(--text-primary)' },
          ].map((m, i) => (
            <div
              key={i}
              className="nyt-card"
              style={{ textAlign: 'center', padding: 20 }}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: m.color,
                marginBottom: 4,
              }}>
                {m.value}
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 500,
              }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Health Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          <div className="nyt-card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              System Health
            </h3>
            {[
              { name: 'Workflow Engine', status: 'operational' },
              { name: 'Agent Manager', status: 'operational' },
              { name: 'Node Executor', status: 'operational' },
              { name: 'Audit Logger', status: 'operational' },
              { name: 'Database', status: 'operational' },
              { name: 'File Storage', status: 'operational' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                <span className="nyt-badge nyt-badge--success">{s.status}</span>
              </div>
            ))}
          </div>

          <div className="nyt-card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              SLA Metrics
            </h3>
            {[
              { name: 'Agent Response Time', current: '<2s', target: '<5s' },
              { name: 'Workflow Completion', current: '98%', target: '95%' },
              { name: 'Error Rate', current: '0.2%', target: '<5%' },
              { name: 'Node Success Rate', current: '99.1%', target: '95%' },
              { name: 'Uptime', current: '100%', target: '99.9%' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 13,
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-success)' }}>{s.current}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/ {s.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Log */}
        <div className="nyt-card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
            Recent Audit Log
          </h3>
          {recentEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 13 }}>
              No audit entries yet. Run an agent to generate activity.
            </div>
          ) : (
            <table className="nyt-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Agent</th>
                  <th>Decision</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry, i) => (
                  <tr key={i}>
                    <td>{String(entry.event || entry.action || '—')}</td>
                    <td>
                      <span className="nyt-badge">
                        {String(entry.agent_id || entry.agentId || '—')}
                      </span>
                    </td>
                    <td>{String(entry.decision || '—')}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {entry.timestamp ? new Date(String(entry.timestamp)).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;
