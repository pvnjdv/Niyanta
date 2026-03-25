import React, { useState } from 'react';
import ThemeToggle from '../shared/ThemeToggle';
import SystemStatus from '../sidebar/SystemStatus';
import SearchBar from '../sidebar/SearchBar';
import AgentRow from '../sidebar/AgentRow';
import { AGENTS, AGENT_LIST } from '../../constants/agents';

export default function LeftPanel({
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
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [runAllHovered, setRunAllHovered] = useState(false);

  const containerStyle = {
    width: 280,
    flexShrink: 0,
    borderRight: '1px solid var(--border)',
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

  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  };

  const logoStyle = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-dim)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: 'var(--text-primary)',
  };

  const titleStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 14,
    color: 'var(--text-primary)',
    letterSpacing: '0.1em',
  };

  const rightIconsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const bellStyle = {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    cursor: 'pointer',
  };

  const searchContainerStyle = {
    padding: '8px 12px',
    flexShrink: 0,
  };

  const agentListStyle = {
    flex: 1,
    overflowY: 'auto',
  };

  const footerStyle = {
    flexShrink: 0,
    padding: 12,
    borderTop: '1px solid var(--border)',
  };

  const runAllButtonStyle = {
    width: '100%',
    height: 36,
    backgroundColor: runAllHovered ? 'var(--accent-dim)' : 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 4,
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: runAllHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
    cursor: isAnyProcessing ? 'not-allowed' : 'pointer',
    opacity: isAnyProcessing ? 0.6 : 1,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  };

  const spinnerStyle = {
    width: 12,
    height: 12,
    border: '2px solid var(--text-secondary)',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const statsStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginTop: 8,
  };

  const filteredAgents = AGENT_LIST.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasCriticalSecurity =
    agentStates.security?.result?.severity === 'CRITICAL';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoContainerStyle}>
          <div style={logoStyle}>नि</div>
          <span style={titleStyle}>NIYANTA</span>
        </div>
        <div style={rightIconsStyle}>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
          <div style={bellStyle}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {hasCriticalSecurity && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--red)',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <SystemStatus
        isAnyProcessing={isAnyProcessing}
        processingAgentName={getProcessingAgentName()}
        agentColor={
          getProcessingAgentName()
            ? AGENTS[
                Object.keys(agentStates).find(
                  (id) => agentStates[id].status === 'processing'
                )
              ]?.color
            : null
        }
      />

      {/* Search */}
      <div style={searchContainerStyle}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Agent List */}
      <div style={agentListStyle}>
        {filteredAgents.map((agent) => (
          <AgentRow
            key={agent.id}
            agent={agent}
            agentState={agentStates[agent.id]}
            isSelected={selectedAgent === agent.id}
            onClick={() => onSelectAgent(agent.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button
          style={runAllButtonStyle}
          onClick={onRunAllAgents}
          onMouseEnter={() => setRunAllHovered(true)}
          onMouseLeave={() => setRunAllHovered(false)}
          disabled={isAnyProcessing}
        >
          {runAllProgress ? (
            <>
              <div style={spinnerStyle} />
              Running {runAllProgress}...
            </>
          ) : (
            <>▶ RUN ALL AGENTS</>
          )}
        </button>
        <div style={statsStyle}>
          {metrics?.totalTasksCreated || 0} tasks autonomous ·{' '}
          {metrics?.escalationsTriggered || 0} escalated
        </div>
      </div>
    </div>
  );
}
