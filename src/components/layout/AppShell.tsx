import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import { ActiveView, RightPanelTab, Theme } from '../../types/ui';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';

interface AppShellProps {
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
  auditEntries: unknown[];
  rightPanelTab: RightPanelTab;
  onRightPanelTabChange: (tab: RightPanelTab) => void;
  onExecuteAgent: (agentId: string, input?: string) => Promise<void>;
  onUseSample: (agentId: string) => Promise<void>;
  onOpenNiyantaChat: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ agents, agentStates, selectedAgentId, onSelectAgent, onRunAll, runAllProgress, activeView, onChangeView, theme, onToggleTheme, metrics, auditEntries, rightPanelTab, onRightPanelTabChange, onExecuteAgent, onUseSample, onOpenNiyantaChat }) => {
  const selectedAgent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) || null : null;
  const selectedState = selectedAgent ? agentStates[selectedAgent.id] : null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <LeftPanel agents={agents} agentStates={agentStates} selectedAgentId={selectedAgentId} onSelectAgent={onSelectAgent} onRunAll={onRunAll} runAllProgress={runAllProgress} activeView={activeView} onChangeView={onChangeView} theme={theme} onToggleTheme={onToggleTheme} metrics={metrics} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <CenterPanel selectedAgent={selectedAgent} selectedState={selectedState} onExecute={onExecuteAgent} onUseSample={onUseSample} />
      </div>
      <RightPanel entries={auditEntries} metrics={metrics} tab={rightPanelTab} onTabChange={onRightPanelTabChange} onOpenNiyantaChat={onOpenNiyantaChat} />
    </div>
  );
};

export default AppShell;
