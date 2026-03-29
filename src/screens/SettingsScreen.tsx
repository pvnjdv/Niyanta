import React, { useEffect, useState } from 'react';
import { Agent } from '../types/agent';

interface SettingsScreenProps {
  agents: Agent[];
}

const chipStyle = (tone: 'ok' | 'warn' | 'info'): React.CSSProperties => {
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

const SettingsScreen: React.FC<SettingsScreenProps> = ({ agents }) => {
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1100 : false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [auditStrictMode, setAuditStrictMode] = useState(true);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [retention, setRetention] = useState('90 days');
  const [servicePulse] = useState(() => Date.now());

  useEffect(() => {
    const onResize = () => setIsCompact(window.innerWidth < 1100);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const controls: Array<{
    key: string;
    title: string;
    subtitle: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }> = [
    {
      key: 'alerts',
      title: 'Live alert notifications',
      subtitle: 'Notify operators on critical workflow and agent incidents.',
      value: alertsEnabled,
      onChange: setAlertsEnabled,
    },
    {
      key: 'strict-audit',
      title: 'Strict audit mode',
      subtitle: 'Enforce immutable logs for every intervention and decision.',
      value: auditStrictMode,
      onChange: setAuditStrictMode,
    },
    {
      key: 'auto-approve',
      title: 'Auto approve low-risk tasks',
      subtitle: 'Route low-risk decisions without manual confirmation.',
      value: autoApproveLowRisk,
      onChange: setAutoApproveLowRisk,
    },
  ];

  const systemServices = [
    { name: 'Niyanta Orchestrator', status: 'UP', latency: 12, uptime: '99.9%' },
    { name: 'Groq AI (llama-3.3)', status: 'UP', latency: 890, uptime: '99.7%' },
    { name: 'Workflow Engine', status: 'UP', latency: 45, uptime: '99.9%' },
    { name: 'SQLite Database', status: 'UP', latency: 2, uptime: '100%' },
    { name: 'Audit Logger', status: 'UP', latency: 8, uptime: '100%' },
  ];

  const agentServiceRows = agents.map((agent, index) => {
    const runs = ((servicePulse + index * 17) % 42) + 18;
    const successRate = 92 + ((servicePulse + index * 7) % 8);
    const avgMs = 700 + ((servicePulse + index * 43) % 900);
    return {
      id: agent.id,
      name: agent.name,
      color: agent.color,
      status: 'UP',
      runs,
      successRate,
      avgTime: `${(avgMs / 1000).toFixed(1)}s`,
    };
  });

  const servicesAllOperational = systemServices.every(service => service.status === 'UP');

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
              Control platform behavior, governance, notifications, and service health.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={chipStyle('ok')}>Config Healthy</span>
            <span style={chipStyle('info')}>Theme Synced</span>
            <span style={chipStyle(servicesAllOperational ? 'ok' : 'warn')}>
              {servicesAllOperational ? 'Services Operational' : 'Service Alert'}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : '2fr 1fr',
          gap: 12,
          alignItems: 'start',
        }}
      >
        <div style={{ ...panelStyle, padding: 14 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Operational Controls
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            {controls.map((control) => (
              <div key={control.key} style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--cc-surface-1)', padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
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
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Data Retention
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {['30 days', '90 days', '180 days'].map((item) => (
                <button
                  key={item}
                  onClick={() => setRetention(item)}
                  style={{
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${retention === item ? 'var(--cc-info-border)' : 'var(--border)'}`,
                    background: retention === item ? 'var(--cc-info-bg)' : 'var(--bg-tile)',
                    color: retention === item ? 'var(--status-info)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Environment
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>API Region: ap-southeast-1</div>
              <div>Release Channel: stable</div>
              <div>Audit Stream: connected</div>
              <div>Last policy sync: 6m ago</div>
            </div>
            <button
              style={{
                marginTop: 12,
                width: '100%',
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--accent-border)',
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
            >
              RUN POLICY CHECK
            </button>
          </div>

          <div style={{ ...panelStyle, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Services Overview
              </div>
              <span style={chipStyle(servicesAllOperational ? 'ok' : 'warn')}>
                {servicesAllOperational ? 'All Systems Up' : 'Attention Needed'}
              </span>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {systemServices.map((service) => {
                const statusColor = service.status === 'UP' ? 'var(--status-success)' : 'var(--status-danger)';
                return (
                  <div
                    key={service.name}
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--cc-surface-1)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{service.name}</div>
                      <div style={{ marginTop: 2, fontSize: 11, color: 'var(--text-secondary)' }}>
                        Uptime {service.uptime} · {service.latency}ms latency
                      </div>
                    </div>
                    <span style={{ alignSelf: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: statusColor }}>
                      {service.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, padding: 14, marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Agent Service Health
          </div>
          <span style={chipStyle('info')}>{agentServiceRows.length} Agents</span>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {agentServiceRows.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No agents available yet.</div>
          ) : (
            agentServiceRows.map((row) => (
              <div
                key={row.id}
                style={{
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${row.color}`,
                  background: 'var(--cc-surface-1)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: isCompact ? '1fr' : '1.3fr 0.6fr 0.8fr 0.8fr',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                  <div style={{ marginTop: 2, fontSize: 11, color: 'var(--text-secondary)' }}>Status {row.status}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Runs {row.runs}</div>
                <div style={{ fontSize: 11, color: row.successRate >= 95 ? 'var(--status-success)' : 'var(--status-warning)', fontFamily: 'var(--font-mono)' }}>
                  Success {row.successRate}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Avg {row.avgTime}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
