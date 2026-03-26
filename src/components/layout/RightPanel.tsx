import React, { useMemo, useState } from 'react';
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
  const [miniInput, setMiniInput] = useState('');
  const decisionEntries = entries.filter((e) => typeof e === 'object' && e !== null && 'decision' in e) as Array<Record<string, unknown>>;
  const recent = useMemo(() => (entries as Array<Record<string, unknown>>).slice(0, 2), [entries]);

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
      <div style={{ height: 200, borderTop: '1px solid var(--border)', padding: 10, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s infinite' }} /><strong style={{ fontSize: 12 }}>NIYANTA COMMAND</strong></div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {recent.map((e, i) => <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(e.event || e.decision || '...')}</div>)}
        </div>
        <input value={miniInput} onFocus={onOpenNiyantaChat} onChange={(e) => setMiniInput(e.target.value)} placeholder="Ask command..." style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '8px 10px' }} />
        <button onClick={onOpenNiyantaChat} style={{ border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 8, padding: '8px 10px' }}>Expand →</button>
      </div>
    </aside>
  );
};

export default RightPanel;
