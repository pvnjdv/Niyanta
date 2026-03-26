import React, { useMemo } from 'react';
import { RightPanelTab } from '../../types/ui';

interface RightPanelProps {
  entries: unknown[];
  metrics: Record<string, unknown>;
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onOpenNiyantaChat: () => void;
  onClose: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ entries, metrics, tab, onTabChange, onOpenNiyantaChat, onClose }) => {
  const recentEntries = useMemo(() => (entries as Array<Record<string, unknown>>).slice(0, 30), [entries]);
  const decisionEntries = useMemo(
    () => recentEntries.filter((e) => 'decision' in e),
    [recentEntries],
  );

  const tabs: Array<{ id: RightPanelTab; label: string }> = [
    { id: 'execution', label: 'Activity' },
    { id: 'audit', label: 'Audit' },
    { id: 'metrics', label: 'Metrics' },
  ];

  return (
    <aside style={{
      width: 320,
      borderLeft: '1px solid var(--border-default)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-surface)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        height: 48,
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Audit Trail</span>
        <button
          className="nyt-btn nyt-btn--ghost nyt-btn--sm"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-default)',
      }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--text-primary)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {tab === 'execution' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 12 }}>
                No activity yet
              </div>
            ) : (
              recentEntries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="nyt-badge nyt-badge--sm" style={{ fontSize: 10 }}>
                      {String(entry.agent_id || entry.agentId || 'system')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {entry.timestamp ? new Date(String(entry.timestamp)).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    {String(entry.event || entry.action || entry.decision || '...')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {decisionEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 12 }}>
                No decisions recorded
              </div>
            ) : (
              decisionEntries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 4,
                  }}>
                    {String(entry.decision || '')}
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
                    {String(entry.reasoning || entry.event || '')}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'metrics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(metrics).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                }}>
                  {typeof value === 'number' ? value.toLocaleString() : String(value || 0)}
                </span>
              </div>
            ))}
            {Object.keys(metrics).length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-tertiary)', fontSize: 12 }}>
                No metrics available
              </div>
            )}
          </div>
        )}
      </div>

      {/* Niyanta Command */}
      <div style={{
        borderTop: '1px solid var(--border-default)',
        padding: 12,
      }}>
        <button
          className="nyt-btn"
          onClick={onOpenNiyantaChat}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          ⊛ Niyanta Command
        </button>
      </div>
    </aside>
  );
};

export default RightPanel;
