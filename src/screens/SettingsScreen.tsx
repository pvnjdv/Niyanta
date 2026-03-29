import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProgressBar from '../components/shared/ProgressBar';
import { fetchHealth, fetchMetrics } from '../services/api';
import { getStorageMode } from '../services/storageMode';
import { Agent, AgentState } from '../types/agent';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';

const SETTINGS_STORAGE_KEY = 'niyanta-settings';

interface LocalSettings {
  alertsEnabled: boolean;
  auditStrictMode: boolean;
  autoApproveLowRisk: boolean;
  retention: string;
}

interface HealthSnapshot {
  status?: string;
  uptimeSeconds?: number;
  agentsActive?: number;
  model?: string;
  timestamp?: string;
  services?: Array<Record<string, unknown>>;
}

interface MetricsSnapshot {
  totalRuns?: number;
  totalWorkflowsRun?: number;
  totalTasksCreated?: number;
  totalDecisionsMade?: number;
  avgProcessingTimeMs?: number;
  activeAgents?: number;
  agentsActive?: number;
  workflows?: number;
  pendingApprovals?: number;
  failedToday?: number;
  criticalAlerts?: number;
  decisionBreakdown?: Record<string, number>;
  workflowStatusBreakdown?: Record<string, number>;
  agentRunCounts?: Record<string, number>;
  recentRuns?: Array<Record<string, unknown>>;
  lastUpdated?: string;
}

const DEFAULT_SETTINGS: LocalSettings = {
  alertsEnabled: true,
  auditStrictMode: true,
  autoApproveLowRisk: false,
  retention: '90 days',
};

const RETENTION_OPTIONS = ['30 days', '90 days', '180 days'];

interface SettingsScreenProps {
  agents: Agent[];
  agentStates?: Record<string, AgentState>;
}

const chipStyle = (tone: 'ok' | 'warn' | 'info' | 'neutral'): React.CSSProperties => {
  const styles: Record<string, React.CSSProperties> = {
    ok: {
      color: 'var(--status-success)',
      borderColor: 'var(--cc-ok-border)',
      background: 'var(--cc-ok-bg)',
    },
    warn: {
      color: 'var(--status-warning)',
      borderColor: 'var(--cc-warn-border)',
      background: 'var(--cc-warn-bg)',
    },
    info: {
      color: 'var(--status-info)',
      borderColor: 'var(--cc-info-border)',
      background: 'var(--cc-info-bg)',
    },
    neutral: {
      color: 'var(--text-secondary)',
      borderColor: 'var(--border)',
      background: 'var(--cc-surface-1)',
    },
  };

  return {
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
    ...styles[tone],
  };
};

const panelStyle: React.CSSProperties = {
  background: 'linear-gradient(160deg, var(--cc-panel-top), var(--cc-panel-bottom))',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--cc-panel-shadow)',
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--text-muted)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const actionButtonStyle: React.CSSProperties = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--cc-surface-1)',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.05em',
  cursor: 'pointer',
};

const formatTimestamp = (value?: string | null) => {
  if (!value) {
    return 'Not yet synced';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet synced' : date.toLocaleString();
};

const formatUptime = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
    return 'No uptime data';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ agents, agentStates = {} }) => {
  const storedSettings = readLocalStorage<LocalSettings>(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1180 : false);
  const [alertsEnabled, setAlertsEnabled] = useState(storedSettings.alertsEnabled);
  const [auditStrictMode, setAuditStrictMode] = useState(storedSettings.auditStrictMode);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(storedSettings.autoApproveLowRisk);
  const [retention, setRetention] = useState(storedSettings.retention);
  const [health, setHealth] = useState<HealthSnapshot>({});
  const [metrics, setMetrics] = useState<MetricsSnapshot>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => new Date().toISOString());

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1180);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    writeLocalStorage<LocalSettings>(SETTINGS_STORAGE_KEY, {
      alertsEnabled,
      auditStrictMode,
      autoApproveLowRisk,
      retention,
    });
    setLastSavedAt(new Date().toISOString());
  }, [alertsEnabled, auditStrictMode, autoApproveLowRisk, retention]);

  const refreshRuntime = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [healthData, metricsData] = await Promise.all([fetchHealth(), fetchMetrics()]);
      setHealth((healthData || {}) as HealthSnapshot);
      setMetrics((metricsData || {}) as MetricsSnapshot);
      setRuntimeError(null);
    } catch {
      setRuntimeError('Live runtime snapshot is currently unavailable.');
      setHealth({});
      setMetrics({});
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshRuntime();
    const interval = setInterval(refreshRuntime, 15000);
    return () => clearInterval(interval);
  }, [refreshRuntime]);

  const controls: Array<{
    key: string;
    title: string;
    subtitle: string;
    value: boolean;
    onChange: (value: boolean) => void;
  }> = [
    {
      key: 'alerts',
      title: 'Live alert notifications',
      subtitle: 'Notify operators on critical workflow failures, approval holds, and system drift.',
      value: alertsEnabled,
      onChange: setAlertsEnabled,
    },
    {
      key: 'strict-audit',
      title: 'Strict audit mode',
      subtitle: 'Capture a trace for every manual intervention and approval decision.',
      value: auditStrictMode,
      onChange: setAuditStrictMode,
    },
    {
      key: 'auto-approve',
      title: 'Auto-approve low-risk tasks',
      subtitle: 'Allow routine flows to proceed automatically when risk remains within policy.',
      value: autoApproveLowRisk,
      onChange: setAutoApproveLowRisk,
    },
  ];

  const systemServices = Array.isArray(health.services) ? (health.services as Array<Record<string, unknown>>) : [];
  const recentRuns = Array.isArray(metrics.recentRuns) ? metrics.recentRuns : [];
  const agentRunCounts = (metrics.agentRunCounts || {}) as Record<string, number>;
  const decisionBreakdown = (metrics.decisionBreakdown || {}) as Record<string, number>;
  const workflowStatusBreakdown = (metrics.workflowStatusBreakdown || {}) as Record<string, number>;

  const approvedCount = Number(decisionBreakdown.autoApprove || 0) + Number(decisionBreakdown.approved || 0) + Number(decisionBreakdown.proceed || 0);
  const flaggedCount = Number(decisionBreakdown.flag || 0);
  const rejectedCount = Number(decisionBreakdown.reject || 0);
  const heldCount = Number(decisionBreakdown.hold || 0);
  const decisionTotal = Number(metrics.totalDecisionsMade || 0) || approvedCount + flaggedCount + rejectedCount + heldCount;
  const automationRate = decisionTotal > 0 ? Math.round((approvedCount / decisionTotal) * 100) : 0;

  const agentRuntimeRows = useMemo(
    () =>
      agents.map((agent) => {
        const state = agentStates[agent.id];
        const matchingRun = recentRuns.find((run) => String(run.workflowName || '').toLowerCase().includes(agent.name.toLowerCase()));
        const status = state?.status === 'error'
          ? 'ERROR'
          : state?.status === 'processing'
            ? 'BUSY'
            : Number(agentRunCounts[agent.id] || 0) > 0
              ? 'UP'
              : 'IDLE';
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

  const servicesAllOperational = systemServices.length > 0 && systemServices.every((service) => String(service.status || '').toUpperCase() === 'UP');
  const storageMode = getStorageMode();
  const storageLabel = storageMode === 'browser' ? 'Browser Demo Mode' : 'Local Server Mode';
  const runtimeTone: 'ok' | 'warn' | 'info' = runtimeError ? 'warn' : servicesAllOperational ? 'ok' : 'info';
  const activeAgents = Number(health.agentsActive || metrics.agentsActive || metrics.activeAgents || 0);
  const totalRuns = Number(metrics.totalRuns || metrics.totalWorkflowsRun || 0);
  const workflowsTracked = Number(metrics.workflows || 0);
  const pendingApprovals = Number(metrics.pendingApprovals || 0);
  const failedToday = Number(metrics.failedToday || 0);
  const criticalAlerts = Number(metrics.criticalAlerts || 0);
  const avgProcessingTimeMs = Math.round(Number(metrics.avgProcessingTimeMs || 0));
  const runningCount = Number(workflowStatusBreakdown.RUNNING || 0);
  const waitingCount = Number(workflowStatusBreakdown.WAITING_APPROVAL || 0);
  const failedCount = Number(workflowStatusBreakdown.FAILED || 0);
  const completedCount = Number(workflowStatusBreakdown.COMPLETED || 0);

  const profileRows = [
    { label: 'Persistence Mode', value: storageLabel },
    { label: 'Model Runtime', value: String(health.model || 'Unconfigured') },
    { label: 'Uptime', value: formatUptime(health.uptimeSeconds) },
    { label: 'Last Runtime Sync', value: formatTimestamp(metrics.lastUpdated || health.timestamp) },
  ];

  const resetToDefaults = () => {
    setAlertsEnabled(DEFAULT_SETTINGS.alertsEnabled);
    setAuditStrictMode(DEFAULT_SETTINGS.auditStrictMode);
    setAutoApproveLowRisk(DEFAULT_SETTINGS.autoApproveLowRisk);
    setRetention(DEFAULT_SETTINGS.retention);
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 20,
        background:
          'radial-gradient(circle at 15% 0%, var(--cc-glow-a), transparent 40%), radial-gradient(circle at 85% 0%, var(--cc-glow-b), transparent 35%)',
      }}
    >
      <div style={{ ...panelStyle, padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>Settings Centre</div>
            <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
              Local operator preferences, governance controls, and live platform runtime in one place.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={chipStyle('info')}>{storageLabel}</span>
            <span style={chipStyle('neutral')}>Saved {formatTimestamp(lastSavedAt)}</span>
            <span style={chipStyle(runtimeTone)}>
              {runtimeError ? 'Snapshot Offline' : servicesAllOperational ? 'Runtime Stable' : 'Needs Attention'}
            </span>
            <button onClick={refreshRuntime} style={actionButtonStyle} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh Snapshot'}
            </button>
            <button onClick={resetToDefaults} style={actionButtonStyle}>
              Reset Defaults
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        <div style={{ ...panelStyle, padding: 14 }}>
          <div style={sectionLabelStyle}>Operational Controls</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {controls.map((control) => (
              <div
                key={control.key}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  background: 'var(--cc-surface-1)',
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{control.title}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: 'var(--text-secondary)' }}>{control.subtitle}</div>
                </div>
                <button
                  onClick={() => control.onChange(!control.value)}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 999,
                    border: `1px solid ${control.value ? 'var(--cc-ok-border)' : 'var(--border)'}`,
                    background: control.value ? 'var(--cc-ok-bg)' : 'var(--bg-tile)',
                    position: 'relative',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label={control.title}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: control.value ? 'var(--status-success)' : 'var(--text-muted)',
                      position: 'absolute',
                      top: 3,
                      left: control.value ? 27 : 4,
                      transition: 'left 160ms ease',
                    }}
                  />
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              border: '1px solid var(--border)',
              borderRadius: 10,
              background: 'var(--cc-surface-1)',
              padding: 12,
            }}
          >
            <div style={sectionLabelStyle}>Policy Posture</div>
            <div style={{ marginTop: 8, display: 'grid', gap: 8, gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, minmax(0, 1fr))' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Alerting</div>
                <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>{alertsEnabled ? 'Critical notifications enabled' : 'Notifications muted'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Audit trail</div>
                <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>{auditStrictMode ? 'Strict immutable logging' : 'Standard logging mode'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Low-risk policy</div>
                <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>{autoApproveLowRisk ? 'Auto-approve enabled' : 'Manual review enforced'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Retention window</div>
                <div style={{ marginTop: 2, fontSize: 13, fontWeight: 600 }}>{retention}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={sectionLabelStyle}>Runtime Profile</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {profileRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
                    gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
            {runtimeError && (
              <div style={{ marginTop: 10, color: 'var(--status-warning)', fontSize: 12 }}>{runtimeError}</div>
            )}
          </div>

          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={sectionLabelStyle}>Data Retention</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {RETENTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setRetention(option)}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${retention === option ? 'var(--cc-info-border)' : 'var(--border)'}`,
                    background: retention === option ? 'var(--cc-info-bg)' : 'var(--bg-tile)',
                    color: retention === option ? 'var(--status-info)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Operator settings are stored locally on this installation. Retention controls describe the preferred operational policy surface rather than deleting historical records automatically.
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, padding: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={sectionLabelStyle}>Automation Snapshot</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={chipStyle(criticalAlerts > 0 ? 'warn' : 'ok')}>{criticalAlerts} Critical Alerts</span>
            <span style={chipStyle(pendingApprovals > 0 ? 'warn' : 'info')}>{pendingApprovals} Pending Approvals</span>
            <span style={chipStyle('neutral')}>{automationRate}% Automation Rate</span>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'grid', gap: 12, gridTemplateColumns: isCompact ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
          {[
            { label: 'Active Agents', value: `${activeAgents}/${Math.max(agents.length, 1)}`, subtext: 'Currently engaged or recently active' },
            { label: 'Tracked Workflows', value: `${workflowsTracked}`, subtext: `${totalRuns} recorded runs` },
            { label: 'Decision Volume', value: `${decisionTotal}`, subtext: `${approvedCount} approved or auto-approved` },
            { label: 'Processing Time', value: `${avgProcessingTimeMs}ms`, subtext: `${failedToday} failed today` },
          ].map((item) => (
            <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.label}</div>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>{item.value}</div>
              <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-secondary)' }}>{item.subtext}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...panelStyle, padding: 14, marginTop: 12 }}>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 0.95fr) minmax(0, 1.05fr)' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={sectionLabelStyle}>Core Services</div>
              <span style={chipStyle(servicesAllOperational ? 'ok' : 'warn')}>
                {servicesAllOperational ? 'All Operational' : 'Investigate'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
              {systemServices.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No live health data is available yet.</div>
              ) : (
                systemServices.map((service) => {
                  const status = String(service.status || 'UNKNOWN').toUpperCase();
                  const statusColor = status === 'UP' ? 'var(--status-success)' : status === 'DEGRADED' ? 'var(--status-warning)' : 'var(--status-danger)';
                  return (
                    <div key={String(service.name || 'service')} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{String(service.name || 'Service')}</div>
                        <div style={{ marginTop: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{String(service.detail || 'No service detail available')}</div>
                      </div>
                      <div style={{ alignSelf: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: statusColor }}>{status}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 10 }}>
              <div style={sectionLabelStyle}>Decision Profile</div>
              <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                {[
                  { label: 'Approved', value: approvedCount, color: 'var(--status-success)' },
                  { label: 'Flagged', value: flaggedCount, color: 'var(--status-warning)' },
                  { label: 'Rejected', value: rejectedCount, color: 'var(--status-danger)' },
                  { label: 'Held', value: heldCount, color: 'var(--status-info)' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>{item.value}</span>
                    </div>
                    <ProgressBar value={decisionTotal > 0 ? (item.value / decisionTotal) * 100 : 0} color={item.color} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 10 }}>
              <div style={sectionLabelStyle}>Workflow Status</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {[
                  { label: 'Running', value: runningCount },
                  { label: 'Waiting Approval', value: waitingCount },
                  { label: 'Failed', value: failedCount },
                  { label: 'Completed', value: completedCount },
                ].map((item) => (
                  <div key={item.label} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 10, background: 'var(--bg-tile)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</div>
                    <div style={{ marginTop: 4, fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, padding: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={sectionLabelStyle}>Agent Runtime</div>
          <span style={chipStyle('info')}>{agentRuntimeRows.length} Agents Tracked</span>
        </div>

        <div style={{ marginTop: 8, display: isCompact ? 'none' : 'grid', gridTemplateColumns: '1.3fr 0.6fr 0.8fr 1.2fr', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          <span>Agent</span>
          <span>Runs</span>
          <span>Last Run</span>
          <span>Last Active</span>
        </div>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {agentRuntimeRows.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No agents available yet.</div>
          ) : (
            agentRuntimeRows.map((row) => (
              <div
                key={row.id}
                style={{
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${row.color}`,
                  background: 'var(--bg-tile)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: isCompact ? '1fr' : '1.3fr 0.6fr 0.8fr 1.2fr',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: row.status === 'ERROR' ? 'var(--status-danger)' : row.status === 'BUSY' ? 'var(--status-warning)' : 'var(--text-secondary)' }}>
                    Status {row.status}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{row.runs}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{row.lastDuration}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.lastActive}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;