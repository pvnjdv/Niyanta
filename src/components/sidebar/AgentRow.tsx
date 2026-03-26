import React from 'react';
import { Agent, AgentState } from '../../types/agent';
import AgentIcon from '../shared/AgentIcon';

interface AgentRowProps {
  agent: Agent;
  agentState: AgentState;
  isSelected: boolean;
  onClick: () => void;
}

const timeAgo = (iso: string | null): string => {
  if (!iso) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
};

const AgentRow: React.FC<AgentRowProps> = ({ agent, agentState, isSelected, onClick }) => (
  <button
    onClick={onClick}
    style={{ height: 64, width: '100%', border: 'none', borderLeft: isSelected ? `3px solid ${agent.color}` : '3px solid transparent', padding: isSelected ? '0 16px 0 13px' : '0 16px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', background: isSelected ? 'var(--bg-active)' : 'transparent', cursor: 'pointer' }}
  >
    <AgentIcon icon={agent.icon} color={agent.color} glow={agent.glow} processing={agentState.status === 'processing'} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <span>{agent.name}</span>
        <span style={{ color: 'var(--text-muted)', fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{timeAgo(agentState.lastActivity)}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {agentState.messages.at(-1)?.content || agent.subtitle}
      </div>
    </div>
    <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, minWidth: 18, textAlign: 'center', borderRadius: 10, background: `${agent.color}22`, color: agent.color, padding: '1px 5px' }}>{agentState.taskCount}</span>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: agentState.status === 'error' ? 'var(--red)' : agentState.status === 'processing' ? agent.color : agentState.status === 'complete' ? agent.color : 'var(--text-muted)', boxShadow: agentState.status === 'processing' ? `0 0 8px ${agent.color}` : 'none', animation: agentState.status === 'processing' ? 'pulse 1s infinite' : undefined }} />
    </div>
  </button>
);

export default AgentRow;
