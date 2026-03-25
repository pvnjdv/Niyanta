import React, { useState } from 'react';
import ThemeToggle from '../shared/ThemeToggle';
import SystemStatus from '../sidebar/SystemStatus';
import SearchBar from '../sidebar/SearchBar';
import AgentRow from '../sidebar/AgentRow';
import { AGENTS, AGENT_LIST } from '../../constants/agents';
import { Theme, AgentStates, AgentId, Metrics } from '../../types';

interface LeftPanelProps {
  theme: Theme;
  onThemeToggle: () => void;
  agentStates: AgentStates;
  selectedAgent: AgentId | null;
  onSelectAgent: (agentId: AgentId) => void;
  onRunAllAgents: () => Promise<void>;
  runAllProgress: string | null;
  isAnyProcessing: boolean;
  getProcessingAgentName: () => string | null;
  metrics: Metrics | null;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  theme,
  onThemeToggle,
  agentStates,
  selectedAgent,
  onSelectAgent,
  onRunAllAgents,
  runAllProgress,
  isAnyProcessing,
  getProcessingAgentName,
  metrics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [runAllHovered, setRunAllHovered] = useState(false);

  const containerStyle: React.CSSProperties = {
    width: 280, flexShrink: 0, borderRight: '1px solid var(--border)', height: '100vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-panel)',
  };

  const headerStyle: React.CSSProperties = {
    height: 56, padding: '0 16px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  };

  const logoContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 };

  const logoStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--accent-dim)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 14, color: 'var(--text-primary)',
  };

  const titleStyle: React.CSSProperties = { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.1em' };
  const rightIconsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
  const bellStyle: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' };
  const searchContainerStyle: React.CSSProperties = { padding: '8px 12px', flexShrink: 0 };
  const agentListStyle: React.CSSProperties = { flex: 1, overflowY: 'auto' };
  const footerStyle: React.CSSProperties = { flexShrink: 0, padding: 12, borderTop: '1px solid var(--border)' };

  const runAllButtonStyle: React.CSSProperties = {
    width: '100%', height: 36, backgroundColor: runAllHovered ? 'var(--accent-dim)' : 'transparent',
    border: '1px solid var(--border)', borderRadius: 4, fontFamily: "'Syne', sans-serif", fontWeight: 700,
    fontSize: 11, textTransform: 'uppercase', color: runAllHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: isAnyProcessing ? 'not-allowed' : 'pointer', opacity: isAnyProcessing ? 0.6 : 1, transition: 'all 0.15s ease',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };

  const spinnerStyle: React.CSSProperties = {
    width: 12, height: 12, border: '2px solid var(--text-secondary)', borderTopColor: 'transparent',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  };

  const statsStyle: React.CSSProperties = { fontFamily: "'Space Mono', monospace", fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 };

  const filteredAgents = AGENT_LIST.filter((agent) => agent.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const hasCriticalSecurity = (agentStates.security?.result as { severity?: string } | null)?.severity === 'CRITICAL';
  const processingAgentId = Object.keys(agentStates).find((id) => agentStates[id as AgentId].status === 'processing') as AgentId | undefined;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={logoContainerStyle}>
          <div style={logoStyle}>नि</div>
          <span style={titleStyle}>NIYANTA</span>
        </div>
        <div style={rightIconsStyle}>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <div style={bellStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasCriticalSecurity && <div style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--red)' }} />}
          </div>
        </div>
      </div>

      <SystemStatus isAnyProcessing={isAnyProcessing} processingAgentName={getProcessingAgentName()} agentColor={processingAgentId ? AGENTS[processingAgentId]?.color : null} />
      <div style={searchContainerStyle}><SearchBar value={searchQuery} onChange={setSearchQuery} /></div>

      <div style={agentListStyle}>
        {filteredAgents.map((agent) => (
          <AgentRow key={agent.id} agent={agent} agentState={agentStates[agent.id]} isSelected={selectedAgent === agent.id} onClick={() => onSelectAgent(agent.id)} />
        ))}
      </div>

      <div style={footerStyle}>
        <button style={runAllButtonStyle} onClick={onRunAllAgents} onMouseEnter={() => setRunAllHovered(true)} onMouseLeave={() => setRunAllHovered(false)} disabled={isAnyProcessing}>
          {runAllProgress ? (<><div style={spinnerStyle} />Running {runAllProgress}...</>) : (<>▶ RUN ALL AGENTS</>)}
        </button>
        <div style={statsStyle}>{metrics?.totalTasksCreated || 0} tasks autonomous · {metrics?.escalationsTriggered || 0} escalated</div>
      </div>
    </div>
  );
};

export default LeftPanel;
