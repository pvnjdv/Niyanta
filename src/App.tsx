import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useAgents } from './hooks/useAgents';
import { useAuditLog } from './hooks/useAuditLog';
import { useNiyantaChat } from './hooks/useNiyantaChat';
import { useMetrics } from './hooks/useMetrics';
import { useWorkflows } from './hooks/useWorkflows';
import { useTheme } from './hooks/useTheme';
import { fetchCrossWorkflowInsights } from './services/api';

import NavigationSidebar from './components/layout/NavigationSidebar';
import NiyantaAIPanel from './components/chat/NiyantaAIPanel';

import CommandCenter from './screens/CommandCenter';
import WorkflowStudio from './screens/WorkflowStudio';
import AgentConsole from './screens/AgentConsole';
import AgentChatScreen from './screens/AgentChatScreen';
import OperationsMonitor from './screens/OperationsMonitor';
import AuditCompliance from './screens/AuditCompliance';
import SettingsScreen from './screens/SettingsScreen';
import { ApprovalsScreen } from './screens/ApprovalsScreen';
import ServicesStatus from './screens/ServicesStatus';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { agents, agentStates, executeAgent, runAllAgents, runAllProgress, addMessage, refreshAgents } = useAgents();
  const { entries } = useAuditLog();
  const { messages, isSending, sendMessage, startNewChat, historySessions, restoreFromHistory, deleteHistorySession } = useNiyantaChat();
  const { metrics } = useMetrics();
  const { workflows, saveWorkflow } = useWorkflows();

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (insights.length === 0) return;
    insights.forEach((insight) => {
      addMessage('meeting', { id: uuid(), type: 'insight', content: insight, timestamp: new Date().toISOString() });
    });
    setInsights([]);
  }, [insights, addMessage]);

  const handleRunAll = async () => {
    await runAllAgents();
    const results = Object.fromEntries(
      Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v)
    );
    const computedInsights = await fetchCrossWorkflowInsights(results as Record<string, unknown>);
    setInsights(computedInsights);
  };

  const agentResults = Object.fromEntries(
    Object.entries(agentStates).map(([k, v]) => [k, v.result]).filter(([, v]) => v)
  );

  const sidebarWidth = sidebarCollapsed ? 64 : 260;

  // Listen for sidebar collapse via detecting width changes
  useEffect(() => {
    const checkWidth = () => {
      const sidebar = document.querySelector('nav');
      if (sidebar) {
        setSidebarCollapsed(sidebar.offsetWidth <= 64);
      }
    };
    const observer = new MutationObserver(checkWidth);
    const timer = setInterval(checkWidth, 300);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setAiPanelOpen(open => !open);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      <NavigationSidebar
        onToggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
        alertCount={0}
      />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          marginLeft: sidebarWidth,
          marginRight: aiPanelOpen ? 380 : 0,
          marginTop: 0,
          transition: 'margin 250ms ease',
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <CommandCenter
                agents={agents}
                agentStates={agentStates}
                metrics={metrics}
                workflows={workflows}
                onRunAll={handleRunAll}
                runAllProgress={runAllProgress}
                onOpenAIPanel={() => setAiPanelOpen(true)}
                theme={theme}
                onToggleTheme={toggleTheme}
              />
            }
          />
          <Route
            path="/workflows"
            element={
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
            }
          />
          <Route
            path="/workflows/:workflowId"
            element={
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
            }
          />
          <Route
            path="/agents"
            element={
              <AgentConsole
                agents={agents}
                agentStates={agentStates}
                onExecuteAgent={executeAgent}
                onRunAll={handleRunAll}
                runAllProgress={runAllProgress}
                refreshAgents={refreshAgents}
              />
            }
          />
          <Route
            path="/agents/:agentId/run"
            element={
              <AgentChatScreen
                agents={agents}
                agentStates={agentStates}
                onExecuteAgent={executeAgent}
              />
            }
          />
          <Route
            path="/agents/:agentId"
            element={
              <AgentConsole
                agents={agents}
                agentStates={agentStates}
                onExecuteAgent={executeAgent}
                onRunAll={handleRunAll}
                runAllProgress={runAllProgress}
                refreshAgents={refreshAgents}
              />
            }
          />
          <Route path="/monitor" element={<OperationsMonitor />} />
          <Route path="/audit" element={<AuditCompliance auditEntries={entries} />} />
          <Route path="/approvals" element={<ApprovalsScreen />} />
          <Route path="/services" element={<ServicesStatus agents={agents} agentStates={agentStates} />} />
          <Route path="/notifications" element={<div style={{ padding: 32 }}><h2>Notifications</h2><p style={{ color: 'var(--text-secondary)' }}>No new notifications.</p></div>} />
          <Route path="/settings" element={<SettingsScreen agents={agents} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Niyanta AI Panel — right side */}
      <NiyantaAIPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        onSend={(msg) => sendMessage(msg, agentResults as Record<string, unknown>)}
        isSending={isSending}
        messages={messages}
        onNewChat={startNewChat}
        historySessions={historySessions}
        onRestoreHistory={restoreFromHistory}
        onDeleteHistory={deleteHistorySession}
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
