import { useState, useCallback, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { AGENTS, AGENT_LIST } from '../constants/agents';
import { SAMPLES } from '../constants/samples';
import { Agent, AgentState, Message } from '../types/agent';
import { runAgent, fetchAgents } from '../services/api';

type AgentStates = Record<string, AgentState>;

const initialState: AgentStates = Object.fromEntries(
  Object.keys(AGENTS).map((id) => [id, { status: 'idle', messages: [], result: null, taskCount: 0, lastActivity: null, processingTime: null }])
);

function apiAgentToFrontend(a: Record<string, unknown>): Agent {
  const id = (a.agent_id || a.id || '') as string;
  return {
    id,
    name: (a.name || '') as string,
    subtitle: (a.subtitle || a.description || '') as string,
    icon: (a.icon || id.slice(0, 2).toUpperCase()) as string,
    color: (a.color || '#888888') as string,
    glow: `rgba(128,128,128,0.2)`,
    description: (a.description || '') as string,
    capabilities: Array.isArray(a.capabilities) ? a.capabilities as string[] : [],
    status: 'idle',
    isTemplate: !!(a.is_template),
    isDefault: !!(a.is_default),
  };
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>(AGENT_LIST);
  const [agentStates, setAgentStates] = useState<AgentStates>(initialState);
  const [runAllProgress, setRunAllProgress] = useState<string | null>(null);

  // Fetch agents from API on mount
  useEffect(() => {
    fetchAgents()
      .then(({ agents: apiAgents }) => {
        const mapped = apiAgents.map(apiAgentToFrontend);
        if (mapped.length > 0) {
          setAgents(mapped);
          // Ensure agentStates has entries for all fetched agents
          setAgentStates(prev => {
            const next = { ...prev };
            for (const a of mapped) {
              if (!next[a.id]) {
                next[a.id] = { status: 'idle', messages: [], result: null, taskCount: 0, lastActivity: null, processingTime: null };
              }
            }
            return next;
          });
        }
      })
      .catch(() => { /* fallback to hardcoded AGENT_LIST */ });
  }, []);

  const refreshAgents = useCallback(async () => {
    try {
      const { agents: apiAgents } = await fetchAgents();
      const mapped = apiAgents.map(apiAgentToFrontend);
      if (mapped.length > 0) {
        setAgents(mapped);
        setAgentStates(prev => {
          const next = { ...prev };
          for (const a of mapped) {
            if (!next[a.id]) {
              next[a.id] = { status: 'idle', messages: [], result: null, taskCount: 0, lastActivity: null, processingTime: null };
            }
          }
          return next;
        });
      }
    } catch { /* ignore */ }
  }, []);

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
    for (let i = 0; i < agents.length; i += 1) {
      const agent = agents[i];
      setRunAllProgress(`Running ${agent.name} (${i + 1}/${agents.length})`);
      await executeAgent(agent.id, SAMPLES[agent.id]);
    }
    setRunAllProgress(null);
  }, [agents, executeAgent]);

  const isAnyProcessing = Object.values(agentStates).some((s) => s.status === 'processing');
  const totalTasksCreated = Object.values(agentStates).reduce((sum, s) => sum + s.taskCount, 0);

  return { agents, agentStates, executeAgent, runAllAgents, runAllProgress, isAnyProcessing, totalTasksCreated, addMessage, refreshAgents };
}
