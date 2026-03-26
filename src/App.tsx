import React, { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useTheme } from './hooks/useTheme';
import { useAgents } from './hooks/useAgents';
import { useAuditLog } from './hooks/useAuditLog';
import { useNiyantaChat } from './hooks/useNiyantaChat';
import { useMetrics } from './hooks/useMetrics';
import { useWorkflows } from './hooks/useWorkflows';
import { AGENT_LIST } from './constants/agents';
import { fetchCrossWorkflowInsights } from './services/api';
import { ActiveView, RightPanelTab } from './types/ui';
import AppShell from './components/layout/AppShell';
import NiyantaChatModal from './components/modals/NiyantaChatModal';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { agentStates, executeAgent, runAllAgents, runAllProgress, addMessage } = useAgents();
  const { entries } = useAuditLog();
  const { messages, isSending, sendMessage } = useNiyantaChat();
  const { metrics } = useMetrics();
  useWorkflows();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>('meeting');
  const [showNiyantaChat, setShowNiyantaChat] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('agents');
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('why-chain');
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (insights.length === 0) return;
    const target = selectedAgentId || 'it_ops';
    insights.forEach((insight) => {
      addMessage(target, { id: uuid(), type: 'insight', content: insight, timestamp: new Date().toISOString() });
    });
    setInsights([]);
  }, [insights, selectedAgentId, addMessage]);

  const handleRunAll = async () => {
    await runAllAgents();
    const results = Object.fromEntries(Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v));
    const computedInsights = await fetchCrossWorkflowInsights(results as Record<string, unknown>);
    setInsights(computedInsights);
  };

  const handleUseSample = async (agentId: string) => {
    await executeAgent(agentId);
    setSelectedAgentId(agentId);
  };

  const agentResults = Object.fromEntries(Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v));

  return (
    <>
      <AppShell
        agents={AGENT_LIST}
        agentStates={agentStates}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        onRunAll={handleRunAll}
        runAllProgress={runAllProgress}
        activeView={activeView}
        onChangeView={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
        metrics={metrics}
        auditEntries={entries}
        rightPanelTab={rightPanelTab}
        onRightPanelTabChange={setRightPanelTab}
        onExecuteAgent={executeAgent}
        onUseSample={handleUseSample}
        onOpenNiyantaChat={() => setShowNiyantaChat(true)}
      />
      <NiyantaChatModal
        isOpen={showNiyantaChat}
        onClose={() => setShowNiyantaChat(false)}
        onSend={(msg) => sendMessage(msg, agentResults as Record<string, unknown>)}
        isSending={isSending}
        messages={messages}
        agentStates={agentStates}
      />
    </>
  );
};

export default App;
