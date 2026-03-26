import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import AgentIcon from '../shared/AgentIcon';

interface AgentRowProps {
  agent: Agent;
  agentState: AgentState;
  isSelected: boolean;
  onClick: () => void;
}

const AgentRow: React.FC<AgentRowProps> = ({ agent, agentState, isSelected, onClick }) => (
  <button
    onClick={onClick}
    style={{ height: 64, width: '100%', border: 'none', borderLeft: isSelected ? `3px solid ${agent.color}` : '3px solid transparent', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: isSelected ? 'var(--bg-active)' : 'transparent', cursor: 'pointer' }}
  >
    <AgentIcon icon={agent.icon} color={agent.color} glow={agent.glow} processing={agentState.status === 'processing'} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <span>{agent.name}</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{agentState.lastActivity ? 'just now' : ''}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {agentState.messages.at(-1)?.content || agent.subtitle}
      </div>
    </div>
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: agentState.status === 'error' ? 'var(--red)' : agentState.status === 'processing' ? agent.color : 'var(--text-muted)' }} />
  </button>
);

export default AgentRow;
