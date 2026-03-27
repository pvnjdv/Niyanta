import React, { useState } from 'react';
import StatusDot from '../components/shared/StatusDot';
import ProgressBar from '../components/shared/ProgressBar';

const OperationsMonitor: React.FC = () => {
  const [timeRange, setTimeRange] = useState('LIVE');
  const ranges = ['LIVE', '1HR', '6HR', '24HR', '7D'];

  const metricTiles = [
    { label: 'SLA HEALTH', value: '84%', color: 'var(--green-primary)' },
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
    { name: 'Meeting Intel', color: '#00D4FF' },
    { name: 'Invoice Proc', color: '#FFB800' },
    { name: 'HR Ops', color: '#00E676' },
    { name: 'Procurement', color: '#FF6B6B' },
    { name: 'Security', color: '#FF4488' },
    { name: 'Compliance', color: '#A78BFA' },
    { name: 'Document', color: '#F59E0B' },
    { name: 'Monitoring', color: '#60A5FA' },
    { name: 'Workflow', color: '#34D399' },
    { name: 'IT Ops', color: '#F472B6' },
  ];

  const slaTrackers = [
    { name: 'Invoice Processing', consumed: 58, target: '4hr' },
    { name: 'Employee Onboarding', consumed: 37, target: '3hr' },
    { name: 'Procurement Review', consumed: 40, target: '2hr' },
    { name: 'Security Response', consumed: 85, target: '1hr' },
    { name: 'Compliance Audit', consumed: 78, target: '4hr' },
  ];

  const getSlaColor = (v: number) => v >= 90 ? 'var(--status-danger)' : v >= 70 ? 'var(--status-warning)' : 'var(--green-primary)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      {/* Filter Bar */}
      <div style={{
        height: 40, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {ranges.map(r => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '4px 12px', fontFamily: 'var(--font-mono)', fontSize: 9,
              textTransform: 'uppercase', color: timeRange === r ? 'var(--green-primary)' : 'var(--text-muted)',
              borderBottom: timeRange === r ? '2px solid var(--green-primary)' : '2px solid transparent',
            }}>{r}</button>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>REFRESH RATE: 10s</span>
      </div>

      {/* Metric Row */}
      <div style={{ display: 'flex', gap: 12, flexShrink: 0, padding: '12px 12px 0' }}>
        {metricTiles.map((m, i) => (
          <div key={i} className="stat-tile" style={{
            flex: 1, height: 80, padding: '12px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{m.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: m.color, lineHeight: 1.1 }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, overflow: 'hidden', padding: '0 12px 12px' }}>
        {/* Live Workflow Runs */}
        <div className="tile" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--green-primary)' }}>LIVE WORKFLOW RUNS</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)', background: 'var(--green-dim)', border: '1px solid var(--green-border)', padding: '1px 6px' }}>{liveWorkflows.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {liveWorkflows.map((wf, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{wf.name}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                    padding: '2px 6px',
                    background: wf.status === 'RUNNING' ? 'var(--green-dim)' : 'rgba(255,184,0,0.1)',
                    border: `1px solid ${wf.status === 'RUNNING' ? 'var(--green-border)' : 'var(--border-warning)'}`,
                    color: wf.status === 'RUNNING' ? 'var(--green-primary)' : 'var(--status-warning)',
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
        <div className="tile" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-warning)' }}>BOTTLENECK HEATMAP</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {bottlenecks.map((b, i) => (
              <div key={i} style={{ height: 36, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, width: 120, flexShrink: 0 }}>{b.node}</span>
                <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', position: 'relative' }}>
                  <div style={{
                    height: '100%', width: `${(b.avgMs / maxMs) * 100}%`,
                    background: b.severity === 'critical' ? 'var(--status-danger)' : b.severity === 'warning' ? 'var(--status-warning)' : 'var(--green-primary)',
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
        <div className="tile" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-info)' }}>AGENT ACTIVITY — LAST 6 HOURS</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {agents.map((a, i) => (
              <div key={i} style={{ height: 32, display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', width: 100, textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>{a.name}</span>
                <div style={{ flex: 1, display: 'flex', gap: 2, padding: '0 4px', position: 'relative' }}>
                  {/* Simulated activity blocks */}
                  {Array.from({ length: Math.floor(Math.random() * 6) + 2 }, (_, j) => {
                    const left = Math.random() * 80;
                    const width = Math.random() * 15 + 3;
                    return (
                      <div key={j} style={{
                        position: 'absolute', left: `${left}%`, width: `${width}%`,
                        height: 12, top: '50%', transform: 'translateY(-50%)',
                        background: `${a.color}99`, borderRadius: 0,
                      }} />
                    );
                  })}
                  {/* Current time indicator */}
                  <div style={{ position: 'absolute', right: '10%', top: 0, bottom: 0, width: 1, background: 'var(--green-primary)' }} />
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
        <div className="tile" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ height: 36, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-warning)' }}>SLA TRACKER BY WORKFLOW</span>
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
