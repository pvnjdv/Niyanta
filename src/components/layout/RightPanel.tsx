import React from 'react';
import { RightPanelTab } from '../../types/ui';
import AuditEntry from '../audit/AuditEntry';
import DecisionCard from '../audit/DecisionCard';
import MetricsGrid from '../audit/MetricsGrid';

interface RightPanelProps {
  entries: unknown[];
  metrics: Record<string, unknown>;
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  onOpenNiyantaChat: () => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ entries, metrics, tab, onTabChange, onOpenNiyantaChat }) => {
  const decisionEntries = entries.filter((e) => typeof e === 'object' && e !== null && 'decision' in e) as Array<Record<string, unknown>>;

  return (
    <aside style={{ width: 340, borderLeft: '1px solid var(--border)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <strong style={{ fontFamily: 'Syne, sans-serif' }}>AUDIT TRAIL</strong>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entries.length}</span>
      </div>
      <div style={{ height: 40, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--border)' }}>
        {(['why-chain', 'decisions', 'metrics'] as RightPanelTab[]).map((t) => <button key={t} onClick={() => onTabChange(t)} style={{ border: 'none', background: 'transparent', color: tab === t ? 'var(--accent)' : 'var(--text-muted)', fontSize: 11 }}>{t.toUpperCase()}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'grid', gap: 8 }}>
        {tab === 'why-chain' && (entries as Array<Record<string, unknown>>).map((entry, i) => <AuditEntry key={i} entry={entry} />)}
        {tab === 'decisions' && decisionEntries.map((entry, i) => <DecisionCard key={i} entry={entry} />)}
        {tab === 'metrics' && <MetricsGrid metrics={metrics} />}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', padding: 10 }}>
        <button onClick={onOpenNiyantaChat} style={{ width: '100%', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 8, padding: '10px 12px' }}>NIYANTA COMMAND</button>
      </div>
    </aside>
  );
};

export default RightPanel;
