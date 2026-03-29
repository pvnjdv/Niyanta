import React, { useEffect, useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';

const OperationsMonitor: React.FC = () => {
  const [timeRange, setTimeRange] = useState('LIVE');
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isStacked = viewportWidth < 1220;
  const ranges = ['LIVE', '1HR', '6HR', '24HR', '7D'];

  const metricTiles = [
    { label: 'SLA HEALTH', value: '84%', color: 'var(--status-success)' },
    { label: 'THROUGHPUT', value: '47/hr', color: 'var(--text-primary)' },
    { label: 'FAILURE RATE', value: '2.1%', color: 'var(--status-warning)' },
    { label: 'QUEUE DEPTH', value: '8', color: 'var(--text-primary)' },
  ];

  const liveWorkflows = [
    { name: 'Invoice Processing #892', node: '8/11', agent: 'Invoice Processor', progress: 73, elapsed: '2.3hr', sla: '4hr', status: 'RUNNING' },
    { name: 'Employee Onboarding #156', node: '5/8', agent: 'HR Operations', progress: 62, elapsed: '1.1hr', sla: '3hr', status: 'RUNNING' },
    { name: 'Procurement Review #44', node: '3/6', agent: 'Procurement', progress: 50, elapsed: '0.8hr', sla: '2hr', status: 'WAITING' },
    { name: 'Compliance Audit #78', node: '2/9', agent: 'Compliance Agent', progress: 22, elapsed: '3.1hr', sla: '4hr', status: 'RUNNING' },
  ];

  const bottlenecks = [
    { node: 'OCR Processing', avgMs: 14500, p95Ms: 18200, severity: 'critical' },
    { node: 'Approval Gate', avgMs: 6200, p95Ms: 12400, severity: 'warning' },
    { node: 'LLM Analysis', avgMs: 3400, p95Ms: 5800, severity: 'normal' },
    { node: 'Data Storage', avgMs: 890, p95Ms: 1200, severity: 'normal' },
    { node: 'Notification', avgMs: 450, p95Ms: 780, severity: 'normal' },
  ];
  const maxMs = Math.max(...bottlenecks.map(b => b.avgMs));

  const slaTrackers = [
    { name: 'Invoice Processing', consumed: 58, target: '4hr' },
    { name: 'Employee Onboarding', consumed: 37, target: '3hr' },
    { name: 'Procurement Review', consumed: 40, target: '2hr' },
    { name: 'Security Response', consumed: 85, target: '1hr' },
    { name: 'Compliance Audit', consumed: 78, target: '4hr' },
  ];

  const getSlaColor = (v: number) => v >= 90 ? 'var(--status-danger)' : v >= 70 ? 'var(--status-warning)' : 'var(--status-success)';
  const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical').length;
  const warningBottlenecks = bottlenecks.filter(b => b.severity === 'warning').length;
  const runningCount = liveWorkflows.filter(wf => wf.status === 'RUNNING').length;

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--cc-panel-shadow)',
    overflow: 'hidden',
    minWidth: 0,
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 22,
    padding: '0 10px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--cc-surface-1)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  };

  const panelHeader = (title: string, tone?: React.CSSProperties) => (
    <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', ...tone }}>
        {title}
      </span>
    </div>
  );

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fadeScale 220ms ease',
      background: 'radial-gradient(circle at 10% 0%, var(--cc-glow-a), transparent 45%), radial-gradient(circle at 90% 0%, var(--cc-glow-b), transparent 38%)',
    }}>
      {/* Header + Filter */}
      <div style={{
        minHeight: 62,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        gap: 12,
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>Operations Monitor</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Runtime throughput, bottlenecks, and SLA burn in one focused workspace</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '4px 12px',
              borderRadius: 999,
              border: `1px solid ${timeRange === r ? 'var(--accent-border)' : 'var(--border)'}`,
              background: timeRange === r ? 'var(--cc-action-primary-bg)' : 'transparent',
              fontFamily: 'var(--font-mono)', fontSize: 9,
              textTransform: 'uppercase',
              color: timeRange === r ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}>{r}</button>
          ))}
          <span style={tagStyle}>Refresh 10s</span>
        </div>
      </div>

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isStacked ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, flexShrink: 0, padding: '12px 12px 0' }}>
        {metricTiles.map((m, i) => (
          <div key={i} style={{
            ...panelStyle,
            height: 92,
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>{m.label}</span>
            <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: m.color, lineHeight: 1.05 }}>{m.value}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{timeRange}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isStacked ? '1fr' : '1.45fr 1fr',
        gap: 12,
        overflow: 'hidden',
        padding: '0 12px 12px',
      }}>
        {/* Left Column */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr', gap: 12, minWidth: 0 }}>
          <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {panelHeader('Live Workflow Runs', { color: 'var(--status-success)' })}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.6fr 0.7fr 0.7fr', gap: 10, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              <span>Workflow</span>
              <span>Node</span>
              <span>Status</span>
              <span>Progress</span>
              <span>Elapsed</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {liveWorkflows.map((wf, i) => (
                <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.7fr 0.6fr 0.7fr 0.7fr', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{wf.node}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: wf.status === 'RUNNING' ? 'var(--status-success)' : 'var(--status-warning)', textTransform: 'uppercase' }}>{wf.status}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{wf.progress}%</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{wf.elapsed}</span>
                  </div>
                  <div style={{ marginTop: 7 }}>
                    <ProgressBar value={wf.progress} color={wf.status === 'RUNNING' ? 'var(--status-success)' : 'var(--status-warning)'} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div style={{ display: 'grid', gridTemplateRows: '0.95fr 1.05fr', gap: 12, minWidth: 0 }}>
          <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {panelHeader('Bottleneck Heatmap', { color: 'var(--status-warning)' })}
            <div style={{ padding: '10px 14px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ ...tagStyle, color: 'var(--status-danger)', borderColor: 'var(--cc-danger-border)', background: 'var(--cc-danger-bg)' }}>{criticalBottlenecks} Critical</span>
              <span style={{ ...tagStyle, color: 'var(--status-warning)', borderColor: 'var(--cc-warn-border)', background: 'var(--cc-warn-bg)' }}>{warningBottlenecks} Warning</span>
              <span style={{ ...tagStyle, color: 'var(--status-success)', borderColor: 'var(--cc-ok-border)', background: 'var(--cc-ok-bg)' }}>{runningCount} Running</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'grid', gap: 8 }}>
              {bottlenecks.map((b, i) => (
                <div key={i} style={{ padding: '9px 12px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--cc-surface-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{b.node}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{b.avgMs}ms</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--cc-surface-1)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(b.avgMs / maxMs) * 100}%`, borderRadius: 999, background: b.severity === 'critical' ? 'var(--status-danger)' : b.severity === 'warning' ? 'var(--status-warning)' : 'var(--status-success)' }} />
                  </div>
                  <div style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>P95 {b.p95Ms}ms</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {panelHeader('SLA Tracker', { color: 'var(--status-warning)' })}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {slaTrackers.map((s, i) => (
                <div key={i} style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: getSlaColor(s.consumed) }}>{s.consumed}%</span>
                  </div>
                  <ProgressBar value={s.consumed} color={getSlaColor(s.consumed)} />
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>Target {s.target}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default OperationsMonitor;
