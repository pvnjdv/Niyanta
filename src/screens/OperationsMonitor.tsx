import React, { useEffect, useMemo, useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';
import { fetchMetrics } from '../services/api';

interface MonitorMetrics {
  totalRuns?: number;
  pendingApprovals?: number;
  failedToday?: number;
  criticalAlerts?: number;
  recentRuns?: Array<Record<string, unknown>>;
  bottlenecks?: Array<Record<string, unknown>>;
  slaTrackers?: Array<Record<string, unknown>>;
}

const OperationsMonitor: React.FC = () => {
  const [timeRange, setTimeRange] = useState('LIVE');
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1400);
  const [metrics, setMetrics] = useState<MonitorMetrics>({});

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setMetrics((await fetchMetrics()) as MonitorMetrics);
      } catch {
        setMetrics({});
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const isStacked = viewportWidth < 1220;
  const ranges = ['LIVE', '1HR', '6HR', '24HR', '7D'];

  const rangeMs: Record<string, number> = {
    LIVE: 15 * 60 * 1000,
    '1HR': 60 * 60 * 1000,
    '6HR': 6 * 60 * 60 * 1000,
    '24HR': 24 * 60 * 60 * 1000,
    '7D': 7 * 24 * 60 * 60 * 1000,
  };

  const recentRuns = Array.isArray(metrics.recentRuns) ? metrics.recentRuns : [];
  const filteredRuns = useMemo(
    () =>
      recentRuns.filter((run) => {
        if (timeRange === 'LIVE') {
          return true;
        }
        const startedAt = Date.parse(String(run.startedAt || run.started_at || ''));
        if (!Number.isFinite(startedAt)) {
          return true;
        }
        return Date.now() - startedAt <= rangeMs[timeRange];
      }),
    [recentRuns, timeRange]
  );

  const bottlenecks = Array.isArray(metrics.bottlenecks) ? metrics.bottlenecks : [];
  const slaTrackers = Array.isArray(metrics.slaTrackers) ? metrics.slaTrackers : [];
  const runningCount = filteredRuns.filter((run) => String(run.status || '').toUpperCase() === 'RUNNING').length;
  const waitingCount = filteredRuns.filter((run) => String(run.status || '').toUpperCase() === 'WAITING_APPROVAL').length;
  const criticalBottlenecks = bottlenecks.filter((b) => String(b.severity) === 'critical').length;
  const warningBottlenecks = bottlenecks.filter((b) => String(b.severity) === 'warning').length;
  const breaches = slaTrackers.filter((tracker) => Number(tracker.consumed || 0) > 100).length;
  const slaHealth = slaTrackers.length > 0 ? Math.max(0, 100 - Math.round((breaches / slaTrackers.length) * 100)) : 100;
  const throughput = filteredRuns.filter((run) => String(run.status || '').toUpperCase() === 'COMPLETED').length;
  const failureRate = (metrics.totalRuns || 0) > 0
    ? `${(((metrics.failedToday || 0) / Math.max(metrics.totalRuns || 1, 1)) * 100).toFixed(1)}%`
    : '0.0%';
  const queueDepth = waitingCount + runningCount + (metrics.pendingApprovals || 0);
  const metricTiles = [
    {
      label: 'SLA HEALTH',
      value: `${slaHealth}%`,
      color: slaHealth >= 85 ? 'var(--status-success)' : slaHealth >= 65 ? 'var(--status-warning)' : 'var(--status-danger)',
    },
    { label: 'THROUGHPUT', value: `${throughput}/${timeRange.toLowerCase()}`, color: 'var(--text-primary)' },
    { label: 'FAILURE RATE', value: failureRate, color: (metrics.failedToday || 0) > 0 ? 'var(--status-warning)' : 'var(--status-success)' },
    { label: 'QUEUE DEPTH', value: `${queueDepth}`, color: 'var(--text-primary)' },
  ];
  const maxMs = Math.max(1, ...bottlenecks.map((item) => Number(item.avgMs || 0)));

  const liveWorkflows = filteredRuns.map((run) => ({
    name: String(run.workflowName || run.workflowId || 'Workflow Run'),
    progress: Number(run.progress || 0),
    status: String(run.status || 'PENDING').replace(/_/g, ' '),
    node: `${Number(run.progress || 0)}%`,
  }));

  const getSlaColor = (value: number) => value >= 90 ? 'var(--status-danger)' : value >= 70 ? 'var(--status-warning)' : 'var(--status-success)';

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

      {/* Four Equal Tiles */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isStacked ? '1fr' : '1fr 1fr',
        gridTemplateRows: isStacked ? 'repeat(4, minmax(240px, 1fr))' : '1fr 1fr',
        gap: 12,
        overflow: 'hidden',
        padding: '12px',
      }}>
        <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {panelHeader('Operations Snapshot', { color: 'var(--status-info)' })}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...tagStyle, color: 'var(--status-success)', borderColor: 'var(--cc-ok-border)', background: 'var(--cc-ok-bg)' }}>{runningCount} Running</span>
            <span style={{ ...tagStyle, color: 'var(--status-danger)', borderColor: 'var(--cc-danger-border)', background: 'var(--cc-danger-bg)' }}>{criticalBottlenecks} Critical</span>
            <span style={{ ...tagStyle, color: 'var(--status-warning)', borderColor: 'var(--cc-warn-border)', background: 'var(--cc-warn-bg)' }}>{warningBottlenecks} Warning</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {metricTiles.map((m, i) => (
              <div key={i} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: '12px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>{m.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {panelHeader('Live Workflow Queue', { color: 'var(--status-success)' })}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr', gap: 8, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            <span>Workflow</span>
            <span>Status</span>
            <span>Node</span>
            <span>Progress</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {liveWorkflows.length === 0 && (
              <div style={{ padding: '16px 14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                No workflow runs recorded for the selected time range.
              </div>
            )}
            {liveWorkflows.map((wf, i) => (
              <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: wf.status === 'RUNNING' ? 'var(--status-success)' : wf.status === 'WAITING APPROVAL' ? 'var(--status-warning)' : wf.status === 'FAILED' ? 'var(--status-danger)' : 'var(--text-secondary)' }}>{wf.status}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{wf.node}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-secondary)' }}>{wf.progress}%</span>
                </div>
                <div style={{ marginTop: 7 }}>
                  <ProgressBar value={wf.progress} color={wf.status === 'RUNNING' ? 'var(--status-success)' : wf.status === 'WAITING APPROVAL' ? 'var(--status-warning)' : wf.status === 'FAILED' ? 'var(--status-danger)' : 'var(--status-info)'} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {panelHeader('Bottleneck Heatmap', { color: 'var(--status-warning)' })}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'grid', gap: 8 }}>
            {bottlenecks.length === 0 && (
              <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: 12 }}>
                Bottleneck data will populate once workflow nodes execute.
              </div>
            )}
            {bottlenecks.map((b, i) => (
              <div key={i} style={{ padding: '10px 11px', border: '1px solid var(--border-subtle)', borderRadius: 8, background: 'var(--cc-surface-1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{String(b.nodeType || b.nodeId || 'Unknown Node')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{Number(b.avgMs || 0)}ms</span>
                </div>
                <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(Number(b.avgMs || 0) / maxMs) * 100}%`, borderRadius: 999, background: String(b.severity) === 'critical' ? 'var(--status-danger)' : String(b.severity) === 'warning' ? 'var(--status-warning)' : 'var(--status-success)' }} />
                </div>
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>P95 {Number(b.p95Ms || 0)}ms · failures {Number(b.failureCount || 0)}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {panelHeader('SLA Tracker', { color: 'var(--status-warning)' })}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {slaTrackers.length === 0 && (
              <div style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: 12 }}>
                SLA trackers appear for active runs with approval deadlines.
              </div>
            )}
            {slaTrackers.map((s, i) => (
              <div key={i} style={{ padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(s.name || 'Workflow')}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: getSlaColor(Number(s.consumed || 0)) }}>{s.consumed === null || s.consumed === undefined ? 'N/A' : `${Number(s.consumed)}%`}</span>
                </div>
                <ProgressBar value={Number(s.consumed || 0)} color={getSlaColor(Number(s.consumed || 0))} />
                <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>Target {String(s.target || 'No SLA')}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default OperationsMonitor;
