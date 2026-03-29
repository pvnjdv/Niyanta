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

  const agents = [
    { name: 'Meeting Intel', color: 'var(--status-info)', blocks: [{ left: 8, width: 12 }, { left: 34, width: 17 }, { left: 61, width: 10 }] },
    { name: 'Invoice Proc', color: 'var(--status-success)', blocks: [{ left: 12, width: 16 }, { left: 43, width: 11 }, { left: 74, width: 9 }] },
    { name: 'Document Intel', color: 'var(--status-warning)', blocks: [{ left: 6, width: 9 }, { left: 29, width: 14 }, { left: 58, width: 15 }] },
  ];

  const slaTrackers = [
    { name: 'Invoice Processing', consumed: 58, target: '4hr' },
    { name: 'Employee Onboarding', consumed: 37, target: '3hr' },
    { name: 'Procurement Review', consumed: 40, target: '2hr' },
    { name: 'Security Response', consumed: 85, target: '1hr' },
    { name: 'Compliance Audit', consumed: 78, target: '4hr' },
  ];

  const getSlaColor = (v: number) => v >= 90 ? 'var(--status-danger)' : v >= 70 ? 'var(--status-warning)' : 'var(--status-success)';

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
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Runtime throughput, bottlenecks, and SLA burn in one view</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
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
        </div>
        <span style={tagStyle}>Refresh: 10s</span>
      </div>

      {/* Metric Row */}
      <div style={{ display: 'grid', gridTemplateColumns: isStacked ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, flexShrink: 0, padding: '12px 12px 0' }}>
        {metricTiles.map((m, i) => (
          <div key={i} style={{
            ...panelStyle,
            height: 86,
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{m.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: m.color, lineHeight: 1.1 }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isStacked ? '1fr' : '1fr 1fr',
        gridTemplateRows: isStacked ? undefined : '1fr 1fr',
        gap: 12,
        overflow: 'hidden',
        padding: '0 12px 12px',
      }}>
        {/* Live Workflow Runs */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-success)' }}>Live Workflow Runs</span>
            <span style={{ marginLeft: 'auto', ...tagStyle, height: 20, color: 'var(--status-success)', borderColor: 'var(--cc-ok-border)', background: 'var(--cc-ok-bg)' }}>{liveWorkflows.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {liveWorkflows.map((wf, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{wf.name}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: wf.status === 'RUNNING' ? 'var(--cc-ok-bg)' : 'var(--cc-warn-bg)',
                    border: `1px solid ${wf.status === 'RUNNING' ? 'var(--cc-ok-border)' : 'var(--cc-warn-border)'}`,
                    color: wf.status === 'RUNNING' ? 'var(--status-success)' : 'var(--status-warning)',
                  }}>{wf.status}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>Node {wf.node} · Agent: {wf.agent}</div>
                <ProgressBar value={wf.progress} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{wf.elapsed} elapsed · SLA: {wf.sla}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottleneck Heatmap */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-warning)' }}>Bottleneck Heatmap</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {bottlenecks.map((b, i) => (
              <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: 120, flexShrink: 0 }}>{b.node}</span>
                <div style={{ flex: 1, height: 8, background: 'var(--cc-surface-1)', position: 'relative', borderRadius: 999 }}>
                  <div style={{
                    borderRadius: 999,
                    height: '100%', width: `${(b.avgMs / maxMs) * 100}%`,
                    background: b.severity === 'critical' ? 'var(--status-danger)' : b.severity === 'warning' ? 'var(--status-warning)' : 'var(--status-success)',
                    transition: 'width 1s ease',
                  }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', width: 60, textAlign: 'right' }}>{b.avgMs}ms</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>P95: {b.p95Ms}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Activity Timeline */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-info)' }}>Agent Activity - Last 6 Hours</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {agents.map((a, i) => (
              <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 100, textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>{a.name}</span>
                <div style={{ flex: 1, display: 'flex', gap: 2, padding: '0 4px', position: 'relative' }}>
                  {/* Deterministic activity blocks for stable rendering */}
                  {a.blocks.map((block, j) => (
                    <div key={j} style={{
                      position: 'absolute',
                      left: `${block.left}%`,
                      width: `${block.width}%`,
                      height: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: a.color,
                      opacity: 0.65,
                      borderRadius: 2,
                    }} />
                  ))}
                  {/* Current time indicator */}
                  <div style={{ position: 'absolute', right: '10%', top: 0, bottom: 0, width: 1, background: 'var(--status-success)' }} />
                </div>
              </div>
            ))}
            {/* Time labels */}
            <div style={{ display: 'flex', paddingLeft: 100, height: 20, alignItems: 'center' }}>
              {['6hr ago', '4hr ago', '2hr ago', 'Now'].map((t, i) => (
                <span key={i} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textAlign: i === 3 ? 'right' : 'left', paddingRight: i === 3 ? 12 : 0 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* SLA Tracker */}
        <div style={{ ...panelStyle, display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-warning)' }}>SLA Tracker By Workflow</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {slaTrackers.map((s, i) => (
              <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: 180, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                <div style={{ flex: 1 }}>
                  <ProgressBar value={s.consumed} color={getSlaColor(s.consumed)} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: getSlaColor(s.consumed), width: 40, textAlign: 'right' }}>{s.consumed}%</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', width: 30 }}>{s.target}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationsMonitor;
