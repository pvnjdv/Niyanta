import React, { useMemo, useState } from 'react';
import { Agent, AgentState } from '../../types/agent';
import { ActiveView, Theme } from '../../types/ui';
import ThemeToggle from '../shared/ThemeToggle';
import SearchBar from '../sidebar/SearchBar';
import SystemStatus from '../sidebar/SystemStatus';
import AgentRow from '../sidebar/AgentRow';

interface LeftPanelProps {
  agents: Agent[];
  agentStates: Record<string, AgentState>;
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onRunAll: () => Promise<void>;
  runAllProgress: string | null;
  activeView: ActiveView;
  onChangeView: (view: ActiveView) => void;
  theme: Theme;
  onToggleTheme: () => void;
  metrics: Record<string, unknown>;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ agents, agentStates, selectedAgentId, onSelectAgent, onRunAll, runAllProgress, activeView, onChangeView, theme, onToggleTheme, metrics }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => agents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())), [agents, search]);

  return (
    <aside style={{ width: 280, borderRight: '1px solid var(--border)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: 56, borderBottom: '1px solid var(--border)', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'Syne, sans-serif' }}>नि</div><strong style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '.15em', fontSize: 14 }}>NIYANTA</strong></div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={{ height: 32, borderBottom: '1px solid var(--border)', padding: '0 12px', display: 'flex', alignItems: 'center' }}><SystemStatus metrics={metrics} /></div>
      <div style={{ padding: 10 }}><SearchBar value={search} onChange={setSearch} /></div>
      <div style={{ height: 40, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        {(['agents', 'workflows', 'monitoring', 'data'] as ActiveView[]).map((view) => <button key={view} onClick={() => onChangeView(view)} style={{ border: 'none', background: 'transparent', color: activeView === view ? 'var(--accent)' : 'var(--text-muted)', borderBottom: activeView === view ? '2px solid var(--accent)' : '2px solid transparent', fontSize: 11 }}>{view.toUpperCase()}</button>)}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>{filtered.map((agent) => <AgentRow key={agent.id} agent={agent} agentState={agentStates[agent.id]} isSelected={selectedAgentId === agent.id} onClick={() => onSelectAgent(agent.id)} />)}</div>
      <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
        <button onClick={() => { void onRunAll(); }} style={{ width: '100%', border: '1px solid var(--accent)', background: 'var(--accent-dim)', color: 'var(--accent)', borderRadius: 8, padding: '10px 12px', fontWeight: 700 }}>▶ RUN ALL AGENTS</button>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>{runAllProgress || 'Ready'}</div>
      </div>
    </aside>
  );
};

export default LeftPanel;
