import React from 'react';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import { Theme, AgentStates, AgentId, AuditEntry, Metrics, Toast, AgentRunResponse } from '../../types';

interface AppShellProps {
  theme: Theme;
  onThemeToggle: () => void;
  agentStates: AgentStates;
  selectedAgent: AgentId | null;
  onSelectAgent: (agentId: AgentId) => void;
  onRunAgent: (agentId: AgentId, inputText: string) => Promise<AgentRunResponse>;
  onRunAllAgents: () => Promise<void>;
  runAllProgress: string | null;
  auditLog: AuditEntry[];
  metrics: Metrics | null;
  isAnyProcessing: boolean;
  getProcessingAgentName: () => string | null;
  onOpenNiyantaChat: () => void;
  toast: Toast | null;
}

const AppShell: React.FC<AppShellProps> = ({
  theme,
  onThemeToggle,
  agentStates,
  selectedAgent,
  onSelectAgent,
  onRunAgent,
  onRunAllAgents,
  runAllProgress,
  auditLog,
  metrics,
  isAnyProcessing,
  getProcessingAgentName,
  onOpenNiyantaChat,
  toast,
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-base)',
  };

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    right: 20,
    backgroundColor: 'var(--bg-panel)',
    border: '1px solid var(--border)',
    borderLeft: `3px solid ${
      toast?.type === 'error'
        ? 'var(--red)'
        : toast?.type === 'success'
        ? 'var(--green)'
        : '#00D4FF'
    }`,
    borderRadius: 4,
    padding: '12px 16px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    zIndex: 1000,
    animation: toast?.visible ? 'slideInBottom 0.25s ease' : 'none',
    opacity: toast?.visible ? 1 : 0,
    transform: toast?.visible ? 'translateX(0)' : 'translateX(100%)',
    transition: 'all 0.25s ease',
    maxWidth: 300,
  };

  return (
    <div style={containerStyle}>
      <LeftPanel
        theme={theme}
        onThemeToggle={onThemeToggle}
        agentStates={agentStates}
        selectedAgent={selectedAgent}
        onSelectAgent={onSelectAgent}
        onRunAllAgents={onRunAllAgents}
        runAllProgress={runAllProgress}
        isAnyProcessing={isAnyProcessing}
        getProcessingAgentName={getProcessingAgentName}
        metrics={metrics}
      />
      <CenterPanel
        selectedAgent={selectedAgent}
        agentStates={agentStates}
        onRunAgent={onRunAgent}
      />
      <RightPanel
        auditLog={auditLog}
        metrics={metrics}
        onOpenNiyantaChat={onOpenNiyantaChat}
        agentStates={agentStates}
      />
      {toast && <div style={toastStyle}>{toast.message}</div>}
    </div>
  );
};

export default AppShell;
