import React, { useEffect, useState } from 'react';
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
  const [showRightPanel, setShowRightPanel] = useState(true);

  useEffect(() => {
    const onResize = () => setShowRightPanel(window.innerWidth >= 1280);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <LeftPanel agents={agents} agentStates={agentStates} selectedAgentId={selectedAgentId} onSelectAgent={onSelectAgent} onRunAll={onRunAll} runAllProgress={runAllProgress} activeView={activeView} onChangeView={onChangeView} theme={theme} onToggleTheme={onToggleTheme} metrics={metrics} />
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {!showRightPanel && <button onClick={() => setShowRightPanel(true)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '6px 8px' }}>Open Audit</button>}
        <CenterPanel selectedAgent={selectedAgent} selectedState={selectedState} onExecute={onExecuteAgent} onUseSample={onUseSample} />
      </div>
      {showRightPanel && <RightPanel entries={auditEntries} metrics={metrics} tab={rightPanelTab} onTabChange={onRightPanelTabChange} onOpenNiyantaChat={onOpenNiyantaChat} />}
    </div>
  );
};

export default AppShell;
