import React, { useEffect, useRef } from 'react';
import { Agent, AgentState, Message } from '../../types/agent';
import EmptyState from '../chat/EmptyState';
import ChatHeader from '../chat/ChatHeader';
import MessageBubble from '../chat/MessageBubble';
import AgentBubble from '../chat/AgentBubble';
import ThinkingIndicator from '../chat/ThinkingIndicator';
import InputBar from '../chat/InputBar';

interface CenterPanelProps {
  selectedAgent: Agent | null;
  selectedState: AgentState | null;
  onExecute: (agentId: string, input?: string) => Promise<void>;
  onUseSample: (agentId: string) => Promise<void>;
}

const CenterPanel: React.FC<CenterPanelProps> = ({ selectedAgent, selectedState, onExecute, onUseSample }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, [selectedState?.messages]);

  if (!selectedAgent || !selectedState) return <EmptyState />;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <ChatHeader agent={selectedAgent} agentState={selectedState} onRun={() => { void onExecute(selectedAgent.id); }} onUseSample={() => { void onUseSample(selectedAgent.id); }} />
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selectedState.messages.map((m: Message) => {
          if (m.type === 'user') return <MessageBubble key={m.id} message={m} />;
          if (m.type === 'agent') return <AgentBubble key={m.id} message={m} agentId={selectedAgent.id} />;
          if (m.type === 'insight') return <div key={m.id} style={{ borderLeft: '3px solid #00D4FF', background: 'rgba(0,212,255,0.05)', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>{m.content}</div>;
          return <div key={m.id} style={{ borderLeft: '3px solid var(--red)', background: 'rgba(255,90,107,0.06)', padding: '10px 12px', borderRadius: 8, fontSize: 13 }}>{m.content}</div>;
        })}
        {selectedState.status === 'processing' && <ThinkingIndicator color={selectedAgent.color} />}
      </div>
      <InputBar agent={selectedAgent} disabled={selectedState.status === 'processing'} onUseSample={() => { void onUseSample(selectedAgent.id); }} onSend={(text) => { void onExecute(selectedAgent.id, text); }} />
    </section>
  );
};

export default CenterPanel;
