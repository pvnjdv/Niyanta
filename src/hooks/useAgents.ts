import { useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { AGENTS, AGENT_LIST } from '../constants/agents';
import { SAMPLES } from '../constants/samples';
import { AgentState, Message } from '../types/agent';
import { runAgent } from '../services/api';

type AgentStates = Record<string, AgentState>;

const initialState: AgentStates = Object.fromEntries(
  Object.keys(AGENTS).map((id) => [id, { status: 'idle', messages: [], result: null, taskCount: 0, lastActivity: null, processingTime: null }])
);

export function useAgents() {
  const [agentStates, setAgentStates] = useState<AgentStates>(initialState);
  const [runAllProgress, setRunAllProgress] = useState<string | null>(null);

  const addMessage = useCallback((agentId: string, message: Message) => {
    setAgentStates((prev) => ({
      ...prev,
      [agentId]: { ...prev[agentId], messages: [...prev[agentId].messages, message], lastActivity: message.timestamp },
    }));
  }, []);

  const executeAgent = useCallback(async (agentId: string, inputText?: string) => {
    const input = inputText && inputText.trim() ? inputText : SAMPLES[agentId] || '';

    addMessage(agentId, { id: uuid(), type: 'user', content: input, timestamp: new Date().toISOString() });

    setAgentStates((prev) => ({ ...prev, [agentId]: { ...prev[agentId], status: 'processing' } }));

    try {
      const response = await runAgent(agentId, input);
      addMessage(agentId, {
        id: uuid(),
        type: 'agent',
        content: typeof response.result.summary === 'string' ? response.result.summary : 'Execution complete',
        timestamp: response.timestamp,
        result: response.result,
        processingTime: response.processingTime,
        model: response.model,
      });

      setAgentStates((prev) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId],
          status: 'complete',
          result: response.result,
          taskCount: Array.isArray(response.result.tasks) ? response.result.tasks.length : prev[agentId].taskCount,
          processingTime: response.processingTime,
        },
      }));
    } catch (error) {
      addMessage(agentId, {
        id: uuid(),
        type: 'error',
        content: error instanceof Error ? error.message : 'Agent execution failed',
        timestamp: new Date().toISOString(),
      });
      setAgentStates((prev) => ({ ...prev, [agentId]: { ...prev[agentId], status: 'error' } }));
    }
  }, [addMessage]);

  const runAllAgents = useCallback(async () => {
    for (let i = 0; i < AGENT_LIST.length; i += 1) {
      const agent = AGENT_LIST[i];
      setRunAllProgress(`Running ${agent.name} (${i + 1}/${AGENT_LIST.length})`);
      await executeAgent(agent.id, SAMPLES[agent.id]);
    }
    setRunAllProgress(null);
  }, [executeAgent]);

  const isAnyProcessing = Object.values(agentStates).some((s) => s.status === 'processing');
  const totalTasksCreated = Object.values(agentStates).reduce((sum, s) => sum + s.taskCount, 0);

  return { agentStates, executeAgent, runAllAgents, runAllProgress, isAnyProcessing, totalTasksCreated, addMessage };
}
