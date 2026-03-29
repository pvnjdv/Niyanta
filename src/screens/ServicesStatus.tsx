import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Agent, AgentState } from '../types/agent';
import { fetchHealth, fetchMetrics } from '../services/api';
import StatusDot from '../components/shared/StatusDot';
import ProgressBar from '../components/shared/ProgressBar';

interface ServicesStatusProps {
  agents: Agent[];
  agentStates?: Record<string, AgentState>;
}

const ServicesStatus: React.FC<ServicesStatusProps> = ({ agents, agentStates = {} }) => {
  const navigate = useNavigate();
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [healthData, metricsData] = await Promise.all([fetchHealth(), fetchMetrics()]);
        setHealth(healthData);
        setMetrics(metricsData);
      } catch {
        setHealth({});
        setMetrics({});
      }
    };

    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const systemServices = Array.isArray(health.services) ? (health.services as Array<Record<string, unknown>>) : [];
  const recentRuns = Array.isArray(metrics.recentRuns) ? (metrics.recentRuns as Array<Record<string, unknown>>) : [];
  const agentRunCounts = (metrics.agentRunCounts || {}) as Record<string, number>;

  const agentServices = useMemo(
    () =>
      agents.map((agent) => {
        const state = agentStates[agent.id];
        const matchingRun = recentRuns.find((run) => String(run.workflowName || '').toLowerCase().includes(agent.name.toLowerCase()));
        const status = state?.status === 'error' ? 'ERROR' : state?.status === 'processing' ? 'BUSY' : 'UP';
        return {
          id: agent.id,
          name: agent.name,
          color: agent.color,
          status,
          runs: Number(agentRunCounts[agent.id] || 0),
          lastDuration: state?.processingTime ? `${(state.processingTime / 1000).toFixed(1)}s` : '—',
          lastActive:
            state?.lastActivity || matchingRun?.startedAt
              ? new Date(String(state?.lastActivity || matchingRun?.startedAt)).toLocaleString()
              : 'No recent activity',
        };
      }),
    [agents, agentRunCounts, agentStates, recentRuns]
  );

  const statusColor = (value: string) =>
    value === 'UP' ? 'var(--green-primary)' : value === 'BUSY' || value === 'DEGRADED' ? 'var(--status-warning)' : 'var(--status-danger)';

  const allUp = systemServices.every((service) => String(service.status) === 'UP');
  const activeAgents = Number(health.agentsActive || metrics.agentsActive || agents.length || 0);
  const workflowCount = Number(metrics.workflows || 0);
  const totalRuns = Number(metrics.totalRuns || metrics.totalWorkflowsRun || 0);
  const totalDecisions = Number(metrics.totalDecisionsMade || 0);
  const uptimeHours = Math.round((Number(health.uptimeSeconds || 0) / 3600) * 10) / 10;
  const queueDepth = Number(metrics.pendingApprovals || 0) + recentRuns.filter((run) => String(run.status || '').toUpperCase() === 'WAITING_APPROVAL').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'fadeScale 220ms ease' }}>
      <div style={{
        height: 56, borderBottom: '1px solid var(--border)', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>SERVICES & SYSTEM STATUS</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>Last refresh {new Date().toLocaleTimeString([], { hour12: false })}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 10px',
            background: allUp ? 'var(--green-dim)' : 'rgba(255,184,0,0.1)',
            border: `1px solid ${allUp ? 'var(--green-border)' : 'var(--border-warning)'}`,
            color: allUp ? 'var(--green-primary)' : 'var(--status-warning)',
          }}>{allUp ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED'}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
        <div className="tile">
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>SYSTEM SERVICES</span>
          </div>
          <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ flex: 1.1, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>SERVICE</span>
            <span style={{ width: 90, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>STATUS</span>
            <span style={{ flex: 1.4, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>DETAIL</span>
          </div>
          {systemServices.map((service, index) => (
            <div key={index} style={{
              height: 44, borderBottom: '1px solid var(--border-subtle)', display: 'flex',
              alignItems: 'center', padding: '0 20px',
              borderLeft: String(service.status) !== 'UP' ? '2px solid var(--status-danger)' : 'none',
            }}>
              <span style={{ flex: 1.1, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{String(service.name || 'Service')}</span>
              <div style={{ width: 90, display: 'flex', alignItems: 'center', gap: 6 }}>
                <StatusDot status={String(service.status) === 'UP' ? 'active' : String(service.status) === 'DEGRADED' ? 'warning' : 'error'} size={6} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColor(String(service.status || 'DOWN')) }}>{String(service.status || 'DOWN')}</span>
              </div>
              <span style={{ flex: 1.4, fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)' }}>{String(service.detail || 'No service detail available')}</span>
            </div>
          ))}
        </div>

        <div className="tile" style={{ marginTop: 12 }}>
          <div style={{ height: 40, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>AGENT SERVICES</span>
          </div>
          <div style={{ height: 32, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <span style={{ flex: 2, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>AGENT</span>
            <span style={{ width: 70, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>STATUS</span>
            <span style={{ width: 64, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>RUNS</span>
            <span style={{ width: 96, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>LAST RUN</span>
            <span style={{ width: 140, fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)' }}>LAST ACTIVE</span>
          </div>
          {agentServices.map((service) => (
            <div key={service.id} style={{
              height: 44, borderBottom: '1px solid var(--border-subtle)', display: 'flex',
              alignItems: 'center', padding: '0 20px', cursor: 'pointer',
            }}
            onClick={() => navigate(`/agents/${service.id}`)}
            onMouseEnter={(event) => (event.currentTarget.style.background = 'var(--bg-tile-hover)')}
            onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: service.color }} />
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13 }}>{service.name}</span>
              </div>
              <div style={{ width: 70, display: 'flex', alignItems: 'center', gap: 4 }}>
                <StatusDot status={service.status === 'ERROR' ? 'error' : service.status === 'BUSY' ? 'warning' : 'active'} color={service.color} size={6} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: statusColor(service.status) }}>{service.status}</span>
              </div>
              <span style={{ width: 64, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{service.runs}</span>
              <span style={{ width: 96, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{service.lastDuration}</span>
              <span style={{ width: 140, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{service.lastActive}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div className="tile" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>ORCHESTRATION LOAD</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Active Agents</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{activeAgents} / {Math.max(agents.length, 1)}</span>
              </div>
              <ProgressBar value={(activeAgents / Math.max(agents.length, 1)) * 100} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Approval Queue</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{queueDepth}</span>
              </div>
              <ProgressBar value={Math.min(100, queueDepth * 10)} color={queueDepth > 0 ? 'var(--status-warning)' : 'var(--status-success)'} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 8 }}>Process uptime: {uptimeHours}h</div>
          </div>

          <div className="tile" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>WORKFLOW STORAGE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>Workflows tracked: <span style={{ color: 'var(--text-primary)' }}>{workflowCount}</span></div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>Recorded Runs</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>{totalRuns}</span>
              </div>
              <ProgressBar value={Math.min(100, totalRuns)} color="var(--status-info)" />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Pending approvals: {Number(metrics.pendingApprovals || 0)}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Failed today: {Number(metrics.failedToday || 0)}</div>
          </div>

          <div className="tile" style={{ flex: 1, padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>AI RUNTIME</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>{totalDecisions}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>DECISIONS RECORDED</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 4 }}>{Math.round(Number(metrics.avgProcessingTimeMs || 0))}ms</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 8 }}>AVG PROCESSING TIME</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>Model: {String(health.model || 'unconfigured')}</div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 6px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{String(health.status || 'unknown').toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesStatus;
