import { useState, useCallback } from 'react';
import { runAgent as apiRunAgent } from '../services/api';
import { SAMPLES } from '../constants/samples';
import { AGENT_LIST } from '../constants/agents';
import {
  AgentId,
  AgentState,
  AgentStates,
  AgentMessage,
  AgentResult,
  AgentRunResponse,
} from '../types';

const createInitialAgentState = (): AgentState => ({
  status: 'idle',
  messages: [],
  result: null,
  taskCount: 0,
  lastActivity: null,
  processingTime: null,
});

const createInitialStates = (): AgentStates => {
  const states: Partial<AgentStates> = {};
  AGENT_LIST.forEach((agent) => {
    states[agent.id] = createInitialAgentState();
  });
  return states as AgentStates;
};

interface UseAgentsReturn {
  agentStates: AgentStates;
  runAgent: (agentId: AgentId, inputText: string) => Promise<AgentRunResponse>;
  runAllAgents: (onProgress?: (progress: string | null, agentId: AgentId | null) => void) => Promise<void>;
  addMessage: (agentId: AgentId, message: AgentMessage) => void;
  resetAgent: (agentId: AgentId) => void;
  isAnyProcessing: boolean;
  getProcessingAgentName: () => string | null;
}

export function useAgents(): UseAgentsReturn {
  const [agentStates, setAgentStates] = useState<AgentStates>(createInitialStates);

  const addMessage = useCallback((agentId: AgentId, message: AgentMessage) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        messages: [...prev[agentId].messages, message],
        lastActivity: new Date().toISOString(),
      },
    }));
  }, []);

  const runAgent = useCallback(
    async (agentId: AgentId, inputText: string): Promise<AgentRunResponse> => {
      // Add user message
      addMessage(agentId, {
        type: 'user',
        content: inputText,
        timestamp: new Date().toISOString(),
      });

      // Set processing state
      setAgentStates((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          status: 'processing',
          lastActivity: new Date().toISOString(),
        },
      }));

      try {
        const response = await apiRunAgent(agentId, inputText);

        // Calculate task count from result
        let taskCount = 0;
        const result = response.result as AgentResult & {
          tasks?: unknown[];
          decisions?: unknown[];
          checklist?: {
            before_day_one?: unknown[];
            day_one?: unknown[];
            week_one?: unknown[];
            month_one?: unknown[];
          };
          next_steps?: unknown[];
          immediate_actions?: unknown[];
        };

        if (result.tasks) taskCount += result.tasks.length;
        if (result.decisions) taskCount += result.decisions.length;
        if (result.checklist) {
          if (result.checklist.before_day_one) taskCount += result.checklist.before_day_one.length;
          if (result.checklist.day_one) taskCount += result.checklist.day_one.length;
          if (result.checklist.week_one) taskCount += result.checklist.week_one.length;
          if (result.checklist.month_one) taskCount += result.checklist.month_one.length;
        }
        if (result.next_steps) taskCount += result.next_steps.length;
        if (result.immediate_actions) taskCount += result.immediate_actions.length;

        // Add agent response message
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: 'complete',
            result: response.result,
            taskCount,
            processingTime: response.processingTime,
            lastActivity: new Date().toISOString(),
            messages: [
              ...prev[agentId].messages,
              {
                type: 'agent' as const,
                content: response.result,
                timestamp: new Date().toISOString(),
                processingTime: response.processingTime,
              },
            ],
          },
        }));

        return response;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setAgentStates((prev) => ({
          ...prev,
          [agentId]: {
            ...prev[agentId],
            status: 'error',
            lastActivity: new Date().toISOString(),
            messages: [
              ...prev[agentId].messages,
              {
                type: 'error' as const,
                content: errorMessage,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        }));
        throw error;
      }
    },
    [addMessage]
  );

  const runAllAgents = useCallback(
    async (onProgress?: (progress: string | null, agentId: AgentId | null) => void) => {
      const agentIds: AgentId[] = ['meeting', 'invoice', 'hr', 'procurement', 'security'];

      for (let i = 0; i < agentIds.length; i++) {
        const agentId = agentIds[i];
        onProgress?.(`${i + 1}/${agentIds.length}`, agentId);

        try {
          await runAgent(agentId, SAMPLES[agentId]);
        } catch (error) {
          console.error(`Error running ${agentId}:`, error);
        }
      }

      onProgress?.(null, null);
    },
    [runAgent]
  );

  const resetAgent = useCallback((agentId: AgentId) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: createInitialAgentState(),
    }));
  }, []);

  const isAnyProcessing = Object.values(agentStates).some(
    (state) => state.status === 'processing'
  );

  const getProcessingAgentName = (): string | null => {
    for (const agent of AGENT_LIST) {
      if (agentStates[agent.id].status === 'processing') {
        return agent.name;
      }
    }
    return null;
  };

  return {
    agentStates,
    runAgent,
    runAllAgents,
    addMessage,
    resetAgent,
    isAnyProcessing,
    getProcessingAgentName,
  };
}
