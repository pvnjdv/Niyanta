import { Agent } from '../types/agent';
import { createDefaultAgentList } from './agentCatalog';

export const AGENT_LIST: Agent[] = createDefaultAgentList();

export const AGENTS: Record<string, Agent> = Object.fromEntries(
  AGENT_LIST.map((agent) => [agent.id, agent])
);
