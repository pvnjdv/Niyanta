import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAgents } from './hooks/useAgents';
import { useAuditLog } from './hooks/useAuditLog';
import { useNiyantaChat } from './hooks/useNiyantaChat';
import { useMetrics } from './hooks/useMetrics';
import { useWorkflows } from './hooks/useWorkflows';
import { useTheme } from './hooks/useTheme';
import { AGENT_LIST } from './constants/agents';
import { fetchCrossWorkflowInsights } from './services/api';
import NavigationSidebar from './components/layout/NavigationSidebar';
import NiyantaChatModal from './components/modals/NiyantaChatModal';
import FloatingNiyantaAssistant from './components/chat/FloatingNiyantaAssistant';
import CommandCenter from './screens/CommandCenter';
import WorkflowStudio from './screens/WorkflowStudio';
import AgentConsole from './screens/AgentConsole';
import OperationsMonitor from './screens/OperationsMonitor';
import AuditCompliance from './screens/AuditCompliance';
import ServicesStatus from './screens/ServicesStatus';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { agentStates, executeAgent, runAllAgents, runAllProgress, addMessage } = useAgents();
  const { entries } = useAuditLog();
  const { messages, isSending, sendMessage } = useNiyantaChat();
  const { metrics } = useMetrics();
  const { workflows, saveWorkflow } = useWorkflows();

  const [showNiyantaChat, setShowNiyantaChat] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (insights.length === 0) return;
    insights.forEach((insight) => {
      addMessage('it_ops', { id: uuid(), type: 'insight', content: insight, timestamp: new Date().toISOString() });
    });
    setInsights([]);
  }, [insights, addMessage]);

  const handleRunAll = async () => {
    await runAllAgents();
    const results = Object.fromEntries(Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v));
    const computedInsights = await fetchCrossWorkflowInsights(results as Record<string, unknown>);
    setInsights(computedInsights);
  };

  const agentResults = Object.fromEntries(Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <NavigationSidebar
        onOpenNiyantaChat={() => setShowNiyantaChat(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        alertCount={0}
      />
      <div style={{ flex: 1, overflow: 'hidden', marginLeft: 384 }}>
        <Routes>
          <Route path="/" element={
            <CommandCenter
              agentStates={agentStates}
              metrics={metrics}
              workflows={workflows}
              onRunAll={handleRunAll}
              runAllProgress={runAllProgress}
            />
          } />
          <Route path="/workflows" element={
            <WorkflowStudio
              workflows={workflows}
              onSaveWorkflow={async (nodes, edges) => {
                await saveWorkflow({
                  name: `Workflow ${new Date().toISOString()}`,
                  description: 'Generated from workflow builder',
                  nodes,
                  edges,
                  category: 'custom',
                });
              }}
            />
          } />
          <Route path="/agents" element={
            <AgentConsole
              agents={AGENT_LIST}
              agentStates={agentStates}
              onExecuteAgent={executeAgent}
              onRunAll={handleRunAll}
              runAllProgress={runAllProgress}
            />
          } />
          <Route path="/agents/:agentId" element={
            <AgentConsole
              agents={AGENT_LIST}
              agentStates={agentStates}
              onExecuteAgent={executeAgent}
              onRunAll={handleRunAll}
              runAllProgress={runAllProgress}
            />
          } />
          <Route path="/monitor" element={
            <OperationsMonitor />
          } />
          <Route path="/audit" element={
            <AuditCompliance auditEntries={entries} />
          } />
          <Route path="/services" element={
            <ServicesStatus agents={AGENT_LIST} />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <NiyantaChatModal
        isOpen={showNiyantaChat}
        onClose={() => setShowNiyantaChat(false)}
        onSend={(msg) => sendMessage(msg, agentResults as Record<string, unknown>)}
        isSending={isSending}
        messages={messages}
        agentStates={agentStates}
      />
      <FloatingNiyantaAssistant
        onSend={(msg) => sendMessage(msg, agentResults as Record<string, unknown>)}
        isSending={isSending}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
