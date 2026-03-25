import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAgents } from './hooks/useAgents';
import { useAuditLog } from './hooks/useAuditLog';
import { fetchMetrics } from './services/api';
import AppShell from './components/layout/AppShell';
import NiyantaChatModal from './components/modals/NiyantaChatModal';

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    agentStates,
    runAgent,
    runAllAgents,
    isAnyProcessing,
    getProcessingAgentName,
  } = useAgents();
  const { log: auditLog, addEntry } = useAuditLog();

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showNiyantaChat, setShowNiyantaChat] = useState(false);
  const [runAllProgress, setRunAllProgress] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch metrics periodically
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show toast
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 4000);
  }, []);

  // Handle agent run
  const handleRunAgent = useCallback(
    async (agentId, inputText) => {
      try {
        const response = await runAgent(agentId, inputText);

        // Add to audit log
        if (response?.result) {
          addEntry(
            agentId,
            response.result.summary || 'Agent processed input',
            response.result.decision || response.result.severity || null
          );
        }

        // Refresh metrics
        const data = await fetchMetrics();
        setMetrics(data);
      } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
        addEntry(agentId, `Error: ${error.message}`, 'ERROR');
      }
    },
    [runAgent, addEntry, showToast]
  );

  // Handle run all agents
  const handleRunAllAgents = useCallback(async () => {
    try {
      await runAllAgents((progress, agentId) => {
        setRunAllProgress(progress);
        if (agentId) {
          setSelectedAgent(agentId);
        }
      });

      // Add summary to audit log
      const completedCount = Object.values(agentStates).filter(
        s => s.status === 'complete'
      ).length;

      showToast(`All agents processed successfully!`, 'success');

      // Refresh metrics
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (error) {
      showToast(`Error running agents: ${error.message}`, 'error');
    }
  }, [runAllAgents, agentStates, showToast]);

  // Handle select agent
  const handleSelectAgent = useCallback((agentId) => {
    setSelectedAgent(agentId);
  }, []);

  // Handle open Niyanta chat
  const handleOpenNiyantaChat = useCallback(() => {
    setShowNiyantaChat(true);
  }, []);

  // Handle close Niyanta chat
  const handleCloseNiyantaChat = useCallback(() => {
    setShowNiyantaChat(false);
  }, []);

  return (
    <>
      <AppShell
        theme={theme}
        onThemeToggle={toggleTheme}
        agentStates={agentStates}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        onRunAgent={handleRunAgent}
        onRunAllAgents={handleRunAllAgents}
        runAllProgress={runAllProgress}
        auditLog={auditLog}
        metrics={metrics}
        isAnyProcessing={isAnyProcessing}
        getProcessingAgentName={getProcessingAgentName}
        onOpenNiyantaChat={handleOpenNiyantaChat}
        toast={toast}
      />
      {showNiyantaChat && (
        <NiyantaChatModal
          agentStates={agentStates}
          onClose={handleCloseNiyantaChat}
        />
      )}
    </>
  );
}

export default App;
