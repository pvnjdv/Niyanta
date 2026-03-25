import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAgents } from './hooks/useAgents';
import { useAuditLog } from './hooks/useAuditLog';
import { fetchMetrics } from './services/api';
import AppShell from './components/layout/AppShell';
import NiyantaChatModal from './components/modals/NiyantaChatModal';
import { AgentId, Metrics, Toast, AgentRunResponse } from './types';

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    agentStates,
    runAgent,
    runAllAgents,
    isAnyProcessing,
    getProcessingAgentName,
  } = useAgents();
  const { log: auditLog, addEntry } = useAuditLog();

  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);
  const [showNiyantaChat, setShowNiyantaChat] = useState<boolean>(false);
  const [runAllProgress, setRunAllProgress] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

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
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 4000);
  }, []);

  // Handle agent run
  const handleRunAgent = useCallback(
    async (agentId: AgentId, inputText: string): Promise<AgentRunResponse> => {
      try {
        const response = await runAgent(agentId, inputText);

        // Add to audit log
        if (response?.result) {
          const result = response.result as { summary?: string; decision?: string; severity?: string };
          addEntry(
            agentId,
            result.summary || 'Agent processed input',
            result.decision || result.severity || null
          );
        }

        // Refresh metrics
        const data = await fetchMetrics();
        setMetrics(data);

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showToast(`Error: ${errorMessage}`, 'error');
        addEntry(agentId, `Error: ${errorMessage}`, 'ERROR');
        throw error;
      }
    },
    [runAgent, addEntry, showToast]
  );

  // Handle run all agents
  const handleRunAllAgents = useCallback(async () => {
    try {
      await runAllAgents((progress: string, agentId?: AgentId) => {
        setRunAllProgress(progress);
        if (agentId) {
          setSelectedAgent(agentId);
        }
      });

      showToast(`All agents processed successfully!`, 'success');

      // Refresh metrics
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showToast(`Error running agents: ${errorMessage}`, 'error');
    } finally {
      setRunAllProgress(null);
    }
  }, [runAllAgents, showToast]);

  // Handle select agent
  const handleSelectAgent = useCallback((agentId: AgentId) => {
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
};

export default App;
