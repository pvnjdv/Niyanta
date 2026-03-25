import React, { useState } from 'react';
import AuditEntry from '../audit/AuditEntry';
import DecisionCard from '../audit/DecisionCard';
import MetricsGrid from '../audit/MetricsGrid';
import Badge from '../shared/Badge';

export default function RightPanel({ auditLog, metrics, onOpenNiyantaChat, agentStates }) {
  const [activeTab, setActiveTab] = useState('whychain');

  const containerStyle = {
    width: 340,
    flexShrink: 0,
    borderLeft: '1px solid var(--border)',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-panel)',
  };

  const headerStyle = {
    height: 56,
    padding: '0 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const headerTitleStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    textTransform: 'uppercase',
    color: 'var(--text-primary)',
    letterSpacing: '0.1em',
  };

  const tabsStyle = {
    height: 40,
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const contentStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
  };

  const emptyStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
  };

  const niyantaMiniStyle = {
    height: 200,
    flexShrink: 0,
    borderTop: '1px solid var(--border)',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
  };

  const miniHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  };

  const miniTitleRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const miniDotStyle = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#00D4FF',
    animation: 'pulse 2s ease-in-out infinite',
  };

  const miniTitleStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
  };

  const expandLinkStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: '#00D4FF',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
  };

  const miniContentStyle = {
    flex: 1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    overflow: 'hidden',
  };

  const miniInputStyle = {
    width: '100%',
    height: 36,
    borderRadius: 18,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    padding: '0 14px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    marginTop: 'auto',
  };

  const decisions = auditLog.filter((entry) => entry.decision);

  const tabs = [
    { key: 'whychain', label: 'WHY-CHAIN' },
    { key: 'decisions', label: 'DECISIONS' },
    { key: 'metrics', label: 'METRICS' },
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={headerTitleStyle}>AUDIT TRAIL</span>
        <Badge text={auditLog.length.toString()} type="muted" size="sm" />
      </div>

      {/* Tabs */}
      <div style={tabsStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            style={tabStyle(activeTab === tab.key)}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {activeTab === 'whychain' && (
          <>
            {auditLog.length === 0 ? (
              <div style={emptyStyle}>No activity yet</div>
            ) : (
              auditLog.map((entry) => (
                <AuditEntry key={entry.id} entry={entry} isNew={entry.isNew} />
              ))
            )}
          </>
        )}
        {activeTab === 'decisions' && (
          <>
            {decisions.length === 0 ? (
              <div style={emptyStyle}>No decisions yet</div>
            ) : (
              <div style={{ paddingTop: 12 }}>
                {decisions.map((entry) => (
                  <DecisionCard key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === 'metrics' && (
          <div style={{ paddingTop: 12 }}>
            <MetricsGrid metrics={metrics} />
          </div>
        )}
      </div>

      {/* Niyanta Mini */}
      <div style={niyantaMiniStyle}>
        <div style={miniHeaderStyle}>
          <div style={miniTitleRowStyle}>
            <div style={miniDotStyle} />
            <span style={miniTitleStyle}>NIYANTA COMMAND</span>
          </div>
          <button style={expandLinkStyle} onClick={onOpenNiyantaChat}>
            Expand →
          </button>
        </div>
        <div style={miniContentStyle}>Ask Niyanta anything...</div>
        <input
          style={miniInputStyle}
          placeholder="Ask Niyanta..."
          onFocus={onOpenNiyantaChat}
        />
      </div>
    </div>
  );
}
