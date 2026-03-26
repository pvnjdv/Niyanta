import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import AgentIcon from '../shared/AgentIcon';

interface ChatHeaderProps {
  agent: Agent;
  agentState: AgentState;
  onRun: () => void;
  onUseSample: () => void;
}

const statusText = (status: AgentState['status']): string => {
  if (status === 'processing') return 'Processing with Groq model...';
  if (status === 'complete') return 'Execution complete';
  if (status === 'error') return 'Execution failed';
  return 'Ready for execution';
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ agent, agentState, onRun, onUseSample }) => (
  <div style={{ height: 56, borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <AgentIcon icon={agent.icon} color={agent.color} glow={agent.glow} />
      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{agent.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{statusText(agentState.status)}</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onUseSample} style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', borderRadius: 6, padding: '7px 10px', fontSize: 12 }}>USE SAMPLE</button>
      <button onClick={onRun} disabled={agentState.status === 'processing'} style={{ border: `1px solid ${agent.color}`, background: `${agent.color}20`, color: agent.color, borderRadius: 6, padding: '7px 10px', fontSize: 11, fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>{agentState.status === 'processing' ? 'EXECUTING...' : '▶ EXECUTE'}</button>
    </div>
  </div>
);

export default ChatHeader;
