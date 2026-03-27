import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgentState } from '../../types/agent';
import { Agent } from '../../types/agent';
import StatusDot from '../shared/StatusDot';
import ProgressBar from '../shared/ProgressBar';

interface CommandCenterProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  metrics: Record<string, unknown>;
  auditEntries: unknown[];
  workflows: Array<{ id?: string; name?: string; status?: string; nodeCount?: number; runCount?: number; successRate?: number }>;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ agents, agentStates, metrics, auditEntries, workflows }) => {
  const navigate = useNavigate();
  const m = metrics as Record<string, number>;
  const totalRuns = m.totalRuns || 47;
  const failedToday = m.failedToday || 3;
  const pendingApprovals = m.pendingApprovals || 8;
  const criticalAlerts = m.criticalAlerts || 2;

  const statTiles = [
    { label: 'ACTIVE WORKFLOWS', value: totalRuns, color: 'var(--green-primary)', sub: '▲ 3 from yesterday', accent: 'var(--green-primary)' },
    { label: 'FAILED TODAY', value: failedToday, color: 'var(--status-danger)', sub: 'requires action', accent: 'var(--status-danger)', flash: failedToday > 0 },
    { label: 'PENDING APPROVALS', value: pendingApprovals, color: 'var(--status-warning)', sub: '2 overdue >12hr', accent: 'var(--status-warning)' },
    { label: 'CRITICAL ALERTS', value: criticalAlerts, color: 'var(--status-danger)', sub: 'security · compliance', accent: 'var(--status-danger)' },
  ];

  const mockWorkflows = [
    { name: 'Invoice Processing #892', node: '8/11', agent: 'Invoice Processor', progress: 73, elapsed: '2.3hr', sla: '4hr', status: 'RUNNING' },
    { name: 'Employee Onboarding #156', node: '5/8', agent: 'HR Operations', progress: 62, elapsed: '1.1hr', sla: '3hr', status: 'RUNNING' },
    { name: 'Procurement Review #44', node: '3/6', agent: 'Procurement', progress: 50, elapsed: '0.8hr', sla: '2hr', status: 'WAITING' },
    { name: 'Security Scan #201', node: '6/6', agent: 'Security Monitor', progress: 100, elapsed: '0.4hr', sla: '1hr', status: 'RUNNING' },
    { name: 'Compliance Audit #78', node: '2/9', agent: 'Compliance Agent', progress: 22, elapsed: '3.1hr', sla: '4hr', status: 'RUNNING' },
  ];

  const mockInsights = [
    'Invoice #892 depends on Procurement #44 vendor approval — potential bottleneck detected',
    'Security Scan #201 completion may trigger compliance re-evaluation for GDPR scope',
    'Employee Onboarding #156 blocked on IT access provisioning — escalation recommended',
  ];

  const mockApprovals = [
    { description: 'Invoice #892 — $48,816 payment approval', wait: '6.2 hours', who: 'CFO required', agent: '#FFB800', overdue: true },
    { description: 'Procurement #44 — Kubernetes platform', wait: '3.1 hours', who: 'VP Engineering', agent: '#FF6B6B', overdue: false },
    { description: 'IT Access — Admin privileges for A.Chen', wait: '1.4 hours', who: 'Security Lead', agent: '#F472B6', overdue: false },
  ];

  const statusColors: Record<string, { bg: string; border: string; text: string }> = {
    RUNNING: { bg: 'var(--green-dim)', border: 'var(--green-border)', text: 'var(--green-primary)' },
    FAILED: { bg: 'rgba(255,45,85,0.1)', border: 'var(--border-danger)', text: 'var(--status-danger)' },
    WAITING: { bg: 'rgba(255,184,0,0.1)', border: 'var(--border-warning)', text: 'var(--status-warning)' },
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      {/* Stat Tiles */}
      <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
        {statTiles.map((s, i) => (
          <div
            key={i}
            onClick={() => {
              if (i === 0) navigate('/workflows');
              if (i === 1) navigate('/monitor');
              if (i === 2) navigate('/audit');
              if (i === 3) navigate('/audit');
            }}
            style={{
              flex: 1, height: 88, background: 'var(--bg-tile)', border: '1px solid var(--border)',
              padding: '0 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
              cursor: 'pointer', borderLeft: `2px solid ${s.accent}`, transition: 'border-color 150ms ease',
              animation: s.flash ? 'criticalFlash 2s infinite' : undefined,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: i === 1 && failedToday > 0 ? s.color : 'var(--text-secondary)' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', gap: 1, overflow: 'hidden' }}>
        {/* Left 60% */}
        <div style={{ flex: 6, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
          {/* Live Workflow Feed */}
          <div style={{ flex: 1, background: 'var(--bg-tile)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--green-primary)' }}>LIVE WORKFLOW FEED</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)',
                  background: 'var(--green-dim)', border: '1px solid var(--green-border)', padding: '2px 8px',
                }}>{totalRuns} RUNNING</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>↻ AUTO-REFRESH</span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
              {mockWorkflows.map((wf, i) => {
                const sc = statusColors[wf.status] || statusColors.RUNNING;
                return (
                  <div key={i} style={{
                    height: 56, borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
                    cursor: 'pointer', transition: 'background 150ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <StatusDot status={wf.status === 'RUNNING' ? 'active' : wf.status === 'WAITING' ? 'warning' : 'error'} size={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: 'var(--text-primary)' }}>{wf.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Node {wf.node} · Agent: {wf.agent}</div>
                    </div>
                    <div style={{ width: 160 }}>
                      <ProgressBar value={wf.progress} />
                    </div>
                    <div style={{ width: 80, textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{wf.elapsed}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)' }}>SLA: {wf.sla}</div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase',
                      padding: '3px 8px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text,
                    }}>{wf.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Niyanta Insights */}
          <div style={{
            height: 160, background: 'var(--bg-tile)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot status="active" color="var(--status-info)" size={6} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-info)' }}>NIYANTA INSIGHTS</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)' }}>AI-DETECTED CROSS-WORKFLOW DEPENDENCIES</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mockInsights.map((insight, i) => (
                <div key={i} style={{
                  height: 40, borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tile-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--status-info)' }}>◆</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{insight}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0 }}>just now</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 40% */}
        <div style={{ flex: 4, display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
          {/* Agent Health Grid */}
          <div style={{ flex: 1, background: 'var(--bg-tile)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{
              height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px', flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--green-primary)' }}>AGENT HEALTH</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)',
                background: 'var(--green-dim)', border: '1px solid var(--green-border)', padding: '2px 8px',
              }}>{agents.length}/{agents.length} ACTIVE</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, padding: 16 }}>
              {agents.map(agent => {
                const state = agentStates[agent.id];
                const isProc = state?.status === 'processing';
                return (
                  <div
                    key={agent.id}
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    style={{
                      height: 48, background: 'var(--bg-tile)', border: '1px solid var(--border)',
                      padding: '0 12px', display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', transition: 'border-color 150ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.35)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,255,136,0.15)')}
                  >
                    <StatusDot status={isProc ? 'processing' : 'active'} color={agent.color} size={6} />
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>98%</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{state?.taskCount || 0}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Approvals */}
          <div style={{
            height: 200, background: 'var(--bg-tile)', border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
          }}>
            <div style={{
              height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', padding: '0 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--status-warning)' }}>PENDING APPROVALS</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  background: 'rgba(255,184,0,0.15)', border: '1px solid var(--border-warning)', padding: '2px 6px', color: 'var(--status-warning)',
                }}>{mockApprovals.length}</span>
              </div>
              <button onClick={() => navigate('/audit')} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green-primary)' }}>VIEW ALL →</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mockApprovals.map((ap, i) => (
                <div key={i} style={{
                  minHeight: 52, borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
                  borderLeft: ap.overdue ? '2px solid var(--status-warning)' : 'none',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ap.agent, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{ap.description}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Waiting {ap.wait} · {ap.who}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button style={{
                      height: 26, padding: '0 12px', background: 'var(--green-dim)',
                      border: '1px solid var(--green-border)', color: 'var(--green-primary)',
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                    }}>APPROVE</button>
                    <button style={{
                      height: 26, padding: '0 12px', background: 'rgba(255,45,85,0.08)',
                      border: '1px solid var(--border-danger)', color: 'var(--status-danger)',
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                    }}>REJECT</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
