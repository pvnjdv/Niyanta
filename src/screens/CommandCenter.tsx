import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentState } from '../types/agent';
import { AGENT_LIST } from '../constants/agents';

interface CommandCenterProps {
  agentStates: Record<string, AgentState>;
  metrics: Record<string, unknown>;
  workflows: Array<{
    id?: string;
    name?: string;
    status?: string;
    nodeCount?: number;
    runCount?: number;
    successRate?: number;
    updated_at?: string;
    nodes?: Array<{ name?: string }>;
  }>;
  onRunAll?: () => Promise<void>;
  runAllProgress?: string | null;
  onOpenAIPanel?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({
  agentStates,
  metrics,
  workflows,
  onRunAll,
  runAllProgress,
  onOpenAIPanel,
  theme = 'dark',
  onToggleTheme,
}) => {
  const navigate = useNavigate();
  const agents = AGENT_LIST;
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1400);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isCompact = viewportWidth < 1180;
  const m = metrics as Record<string, unknown>;
  const toNum = (value: unknown, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const totalRuns = toNum(m.totalWorkflowsRun ?? m.totalRuns, workflows.length);
  const failedToday = toNum(m.failedToday, 0);
  const pendingApprovals = toNum(m.pendingApprovals, 0);
  const criticalAlerts = toNum(m.criticalAlerts, 0);

  const activeAgents = useMemo(
    () => Object.values(agentStates).filter(s => s.status === 'processing' || s.status === 'complete').length,
    [agentStates]
  );

  const firstDecision = useMemo(() => {
    const st = Object.values(agentStates).find(s => s.result && typeof (s.result as any)?.decision === 'string');
    if (!st || !st.result) return null;
    const result = st.result as Record<string, unknown>;
    const decision = String(result.decision || 'PENDING');
    const reasonText = String(result.reason || 'Awaiting additional validation before final decision.');
    const confidenceRaw = result.confidence;
    const confidence = typeof confidenceRaw === 'number' ? Math.max(0, Math.min(100, Math.round(confidenceRaw * (confidenceRaw <= 1 ? 100 : 1)))) : 82;
    return { decision, reasonText, confidence };
  }, [agentStates]);

  const activityItems = useMemo(() => {
    const out: Array<{ time: string; label: string; detail: string; tone: 'ok' | 'warn' | 'danger' | 'info' }> = [];
    Object.entries(agentStates).forEach(([agentId, state]) => {
      const agentName = agents.find(a => a.id === agentId)?.name || agentId;
      (state.messages || []).slice(-3).forEach(msg => {
        const content = msg.content || '';
        const lc = content.toLowerCase();
        const tone = lc.includes('error') || lc.includes('failed')
          ? 'danger'
          : lc.includes('flag') || lc.includes('warning')
            ? 'warn'
            : lc.includes('approve') || lc.includes('complete')
              ? 'ok'
              : 'info';
        out.push({
          time: msg.timestamp || new Date().toISOString(),
          label: agentName,
          detail: content,
          tone,
        });
      });
    });

    return out
      .sort((a, b) => (a.time < b.time ? 1 : -1))
      .slice(0, 8);
  }, [agentStates, agents]);

  const executionStages = useMemo(() => {
    const wf = workflows.find(w => /invoice/i.test(w.name || '')) || workflows[0];
    let nodesArray: Array<{ name?: string }> = [];
    if (Array.isArray(wf?.nodes)) {
      nodesArray = wf.nodes as Array<{ name?: string }>;
    } else if (typeof wf?.nodes === 'string') {
      try {
        const parsed = JSON.parse(wf.nodes);
        if (Array.isArray(parsed)) nodesArray = parsed as Array<{ name?: string }>;
      } catch {
        nodesArray = [];
      }
    }
    const source = nodesArray.slice(0, 5);
    const base = source.length > 0
      ? source.map((node: { name?: string }) => node.name || 'Step')
      : ['Input', 'OCR', 'Validation', 'Decision', 'Approval'];

    const hasProcessing = Object.values(agentStates).some(s => s.status === 'processing');
    const hasComplete = Object.values(agentStates).some(s => s.status === 'complete');
    const runningIndex = hasProcessing ? Math.min(2, base.length - 1) : hasComplete ? base.length - 1 : 0;

    return base.map((name, idx) => ({
      name,
      state: idx < runningIndex ? 'complete' : idx === runningIndex ? (hasComplete ? 'complete' : 'running') : 'waiting',
    }));
  }, [workflows, agentStates]);

  const progressPct = useMemo(() => {
    const done = executionStages.filter(s => s.state === 'complete').length;
    const running = executionStages.some(s => s.state === 'running') ? 0.45 : 0;
    return Math.round(((done + running) / Math.max(1, executionStages.length)) * 100);
  }, [executionStages]);

  const activeRunRows = useMemo(() => {
    return workflows.slice(0, 8).map((wf, idx) => {
      const updated = wf.updated_at ? new Date(wf.updated_at).getTime() : Date.now() - idx * 90000;
      const elapsedSec = Math.max(1, Math.round((Date.now() - updated) / 1000));
      const status = wf.status === 'active' ? (idx % 3 === 0 ? 'running' : idx % 3 === 1 ? 'waiting' : 'completed') : 'draft';
      const owner = agents[idx % agents.length]?.name || 'Ops Agent';
      return {
        id: `#${(wf.id || `wf-${idx}`).slice(0, 10).toUpperCase()}`,
        workflow: wf.name || 'Untitled Workflow',
        owner,
        status,
        elapsedSec,
      };
    });
  }, [workflows, agents]);

  const alerts = useMemo(() => {
    const list: Array<{ level: 'critical' | 'warning' | 'info'; title: string; detail: string }> = [];
    if (criticalAlerts > 0) {
      list.push({
        level: 'critical',
        title: `${criticalAlerts} Critical Alert${criticalAlerts > 1 ? 's' : ''}`,
        detail: 'Immediate review required for high-impact execution failures.',
      });
    }
    if (failedToday > 0) {
      list.push({
        level: 'warning',
        title: `${failedToday} Failed Run${failedToday > 1 ? 's' : ''} Today`,
        detail: 'Retry queue is available for targeted node-level reruns.',
      });
    }
    if (list.length === 0) {
      list.push({
        level: 'info',
        title: 'No Critical System Alerts',
        detail: 'Monitoring layer reports stable operations across active services.',
      });
    }
    return list;
  }, [criticalAlerts, failedToday]);

  const headerBadge = (label: string, tone: 'ok' | 'warn' | 'danger' | 'info') => {
    const toneStyles: Record<string, React.CSSProperties> = {
      ok: { color: 'var(--status-success)', borderColor: 'var(--cc-ok-border)', background: 'var(--cc-ok-bg)' },
      warn: { color: 'var(--status-warning)', borderColor: 'var(--cc-warn-border)', background: 'var(--cc-warn-bg)' },
      danger: { color: 'var(--status-danger)', borderColor: 'var(--cc-danger-border)', background: 'var(--cc-danger-bg)' },
      info: { color: 'var(--status-info)', borderColor: 'var(--cc-info-border)', background: 'var(--cc-info-bg)' },
    };
    return (
      <span style={{
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 10px',
        borderRadius: 999,
        border: '1px solid',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        ...toneStyles[tone],
      }}>
        {label}
      </span>
    );
  };

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
    border: '1px solid var(--border)',
    borderRadius: 12,
    boxShadow: 'var(--cc-panel-shadow)',
    padding: 14,
    minWidth: 0,
  };

  const sectionHeader = (title: string, badge: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '0.02em',
        marginBottom: 2,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {badge}
        <button
          onClick={() => onToggleTheme?.()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--cc-surface-1)',
            color: 'var(--text-secondary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '◐' : '◑'}
        </button>
        <button
          onClick={() => onOpenAIPanel?.()}
          style={{
            width: 32,
            height: 32,
            padding: 0,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--cc-surface-1)',
            color: 'var(--status-info)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Open Niyanta AI panel"
        >
          ◎
        </button>
      </div>
    </div>
  );

  const layoutStyle: React.CSSProperties = isCompact
    ? { display: 'grid', gridTemplateColumns: '1fr', gap: 12 }
    : {
        display: 'grid',
        gridTemplateColumns: '1.6fr 1fr',
        gridTemplateAreas: `
          "live decision"
          "activity intervention"
          "runs runs"
          "alerts state"
        `,
        gap: 12,
      };

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: isCompact ? 14 : 20,
      background: 'radial-gradient(circle at 15% 0%, var(--cc-glow-a), transparent 40%), radial-gradient(circle at 85% 0%, var(--cc-glow-b), transparent 35%)',
    }}>
      {sectionHeader(
        'Command Centre',
        headerBadge(activeAgents > 0 ? 'System Online' : 'Standby', activeAgents > 0 ? 'ok' : 'info')
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        color: 'var(--text-secondary)',
        fontSize: 13,
      }}>
        <span>Real-time AI Operations & Workflow Control</span>
        {runAllProgress && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--status-info)' }}>
            {runAllProgress}
          </span>
        )}
      </div>

      <div style={layoutStyle}>
        {/* LIVE EXECUTION */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'live' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live Execution
            </div>
            {headerBadge('Running', 'ok')}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 10 }}>
            Workflow: <span style={{ color: 'var(--text-primary)' }}>{workflows[0]?.name || 'Invoice Processing'}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${executionStages.length}, minmax(90px, 1fr))`,
            gap: 8,
            marginBottom: 10,
          }}>
            {executionStages.map((stage, idx) => {
              const tone = stage.state === 'complete'
                ? 'var(--status-success)'
                : stage.state === 'running'
                  ? 'var(--status-info)'
                  : 'var(--text-muted)';
              return (
                <div key={stage.name + idx} style={{
                  border: `1px solid ${stage.state === 'running' ? 'var(--cc-info-border)' : 'var(--border)'}`,
                  borderRadius: 8,
                  background: 'var(--cc-surface-1)',
                  padding: '10px 8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      width: 9,
                      height: 9,
                      borderRadius: 999,
                      background: tone,
                      boxShadow: stage.state === 'running' ? `0 0 10px ${tone}` : 'none',
                      animation: stage.state === 'running' ? 'greenPulse 1.8s infinite' : undefined,
                    }} />
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {stage.state}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.35 }}>{stage.name}</div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Current Node: <span style={{ color: 'var(--status-info)' }}>{executionStages.find(s => s.state === 'running')?.name || executionStages[executionStages.length - 1]?.name}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-input)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--cc-progress-start), var(--cc-progress-end))',
              transition: 'width 240ms ease',
            }} />
          </div>
        </section>

        {/* DECISION + CONTROLS */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'decision' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Decision + Controls
            </div>
            {headerBadge(firstDecision ? 'Explained' : 'Pending', firstDecision ? 'info' : 'warn')}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Decision</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 23, color: firstDecision ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 700 }}>
              {firstDecision?.decision || 'UNDER REVIEW'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>
              Confidence: <span style={{ color: 'var(--text-primary)' }}>{firstDecision?.confidence ?? 0}%</span>
            </div>
          </div>
          <div style={{
            padding: '10px 10px',
            border: '1px solid var(--border)',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            background: 'var(--bg-input)',
          }}>
            {firstDecision?.reasonText || 'No decision context available yet. Trigger a run to populate this panel.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <button
              onClick={() => onRunAll?.()}
              disabled={!onRunAll}
              style={{
                height: 34,
                borderRadius: 6,
                border: '1px solid var(--accent-border)',
                background: 'var(--cc-action-primary-bg)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
              }}
            >
              Run All Agents
            </button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={{ height: 32, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--cc-surface-1)', color: 'var(--text-secondary)', fontSize: 11 }}>Retry Failed</button>
              <button style={{ height: 32, borderRadius: 6, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 11 }}>Cancel</button>
            </div>
          </div>
        </section>

        {/* ACTIVITY LOG */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'activity' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Activity Log
            </div>
            {headerBadge('Live', 'ok')}
          </div>
          <div style={{ display: 'grid', gap: 7, maxHeight: 260, overflow: 'auto', paddingRight: 4 }}>
            {(activityItems.length > 0 ? activityItems : [{ time: new Date().toISOString(), label: 'System', detail: 'Awaiting agent activity events', tone: 'info' as const }]).map((item, idx) => {
              const dotColor = item.tone === 'ok'
                ? 'var(--status-success)'
                : item.tone === 'warn'
                  ? 'var(--status-warning)'
                  : item.tone === 'danger'
                    ? 'var(--status-danger)'
                    : 'var(--status-info)';
              return (
                <div key={`${item.time}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '68px 1fr', gap: 10, alignItems: 'start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {new Date(item.time).toLocaleTimeString([], { hour12: false })}
                  </div>
                  <div style={{ display: 'grid', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor }} />
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HUMAN INTERVENTION */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'intervention' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Human Intervention
            </div>
            {headerBadge(`${pendingApprovals || 1} Pending`, pendingApprovals > 0 ? 'warn' : 'info')}
          </div>
          <div style={{
            border: '1px solid var(--cc-warn-border)',
            background: 'var(--cc-warn-bg)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 6 }}>Invoice #INV-1088</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Vendor: Zenith Supplies · Amount: ₹75,000
            </div>
            <div style={{ fontSize: 12, color: 'var(--status-warning)' }}>Reason: Exceeds auto-approval threshold</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => navigate('/audit')} style={{ height: 32, borderRadius: 6, border: '1px solid var(--cc-ok-border)', background: 'var(--cc-ok-bg)', color: 'var(--status-success)', fontSize: 12 }}>Approve</button>
            <button onClick={() => navigate('/audit')} style={{ height: 32, borderRadius: 6, border: '1px solid var(--cc-danger-border)', background: 'var(--cc-danger-bg)', color: 'var(--status-danger)', fontSize: 12 }}>Reject</button>
          </div>
        </section>

        {/* ACTIVE RUNS TABLE */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'runs' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Runs Table
            </div>
            <button onClick={() => navigate('/workflows')} style={{ height: 24, padding: '0 10px', borderRadius: 999, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>View All</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="nyt-table" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Workflow</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Elapsed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(activeRunRows.length > 0 ? activeRunRows : [{ id: '#N/A', workflow: 'No active runs', owner: 'System', status: 'draft', elapsedSec: 0 }]).map(row => {
                  const statusTone = row.status === 'running'
                    ? 'var(--status-success)'
                    : row.status === 'waiting'
                      ? 'var(--status-warning)'
                      : row.status === 'completed'
                        ? 'var(--status-info)'
                        : 'var(--text-muted)';
                  return (
                    <tr key={row.id + row.workflow}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{row.id}</td>
                      <td>{row.workflow}</td>
                      <td>{row.owner}</td>
                      <td><span style={{ color: statusTone, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontSize: 10 }}>{row.status}</span></td>
                      <td>{row.elapsedSec}s</td>
                      <td>
                        <button style={{ height: 24, padding: '0 8px', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 10 }}>
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ALERTS */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'alerts' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Alerts
            </div>
            {headerBadge(criticalAlerts > 0 ? 'Attention' : 'Stable', criticalAlerts > 0 ? 'danger' : 'ok')}
          </div>
          <div style={{ display: 'grid', gap: 9 }}>
            {alerts.map((a, idx) => {
              const color = a.level === 'critical'
                ? 'var(--status-danger)'
                : a.level === 'warning'
                  ? 'var(--status-warning)'
                  : 'var(--status-info)';
              return (
                <div key={a.title + idx} style={{ border: '1px solid var(--border)', borderLeft: `3px solid ${color}`, borderRadius: 7, padding: '10px 10px', background: 'var(--bg-input)' }}>
                  <div style={{ color, fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.detail}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SYSTEM STATE */}
        <section style={{ ...panelStyle, gridArea: isCompact ? undefined : 'state' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              System State
            </div>
            {headerBadge('Online', 'ok')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 7, padding: 10, background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Active Agents</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1 }}>{activeAgents}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 7, padding: 10, background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Running Workflows</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1 }}>{Math.max(1, activeRunRows.filter(r => r.status === 'running').length)}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 7, padding: 10, background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Errors (24h)</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1, color: failedToday > 0 ? 'var(--status-danger)' : 'var(--text-primary)' }}>{failedToday}</div>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 7, padding: 10, background: 'var(--bg-input)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Avg Execution</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, lineHeight: 1.1 }}>{(toNum(m.avgProcessingTimeMs, 1200) / 1000).toFixed(1)}s</div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
            <span>Total Runs: {totalRuns}</span>
            <button onClick={() => navigate('/services')} style={{ height: 24, padding: '0 9px', borderRadius: 5, border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 10 }}>Open Services</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CommandCenter;
