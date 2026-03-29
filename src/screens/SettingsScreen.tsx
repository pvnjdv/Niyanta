import React, { useEffect, useState } from 'react';

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

const SettingsScreen: React.FC = () => {
  const [isCompact, setIsCompact] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 1100 : false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [auditStrictMode, setAuditStrictMode] = useState(true);
  const [autoApproveLowRisk, setAutoApproveLowRisk] = useState(false);
  const [retention, setRetention] = useState('90 days');

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
              Control platform behavior, governance, and notification posture.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={chipStyle('ok')}>Config Healthy</span>
            <span style={chipStyle('info')}>Theme Synced</span>
            <span style={chipStyle('warn')}>2 Changes Pending</span>
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
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
