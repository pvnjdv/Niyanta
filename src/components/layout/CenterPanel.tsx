import React, { useRef, useEffect } from 'react';
import { AGENTS } from '../../constants/agents';
import { SAMPLES } from '../../constants/samples';
import EmptyState from '../chat/EmptyState';
import ChatHeader from '../chat/ChatHeader';
import MessageBubble from '../chat/MessageBubble';
import AgentBubble from '../chat/AgentBubble';
import ThinkingIndicator from '../chat/ThinkingIndicator';
import InputBar from '../chat/InputBar';
import { AgentStates, AgentId, AgentResult, AgentRunResponse } from '../../types';

interface CenterPanelProps {
  selectedAgent: AgentId | null;
  agentStates: AgentStates;
  onRunAgent: (agentId: AgentId, inputText: string) => Promise<AgentRunResponse>;
}

const CenterPanel: React.FC<CenterPanelProps> = ({ selectedAgent, agentStates, onRunAgent }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = selectedAgent ? AGENTS[selectedAgent] : null;
  const agentState = selectedAgent ? agentStates[selectedAgent] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentState?.messages]);

  const handleSend = (text: string) => {
    if (text.trim() && selectedAgent) {
      onRunAgent(selectedAgent, text.trim());
    }
  };

  const handleUseSample = () => {
    if (selectedAgent) {
      onRunAgent(selectedAgent, SAMPLES[selectedAgent]);
    }
  };

  const handleRun = () => {
    // This is called from execute button - we need input from InputBar
    // For now, just use sample when clicking execute
    if (selectedAgent) {
      handleUseSample();
    }
  };

  const containerStyle: React.CSSProperties = {
    flex: 1, display: 'flex', flexDirection: 'column', height: '100vh',
    overflow: 'hidden', minWidth: 0, backgroundColor: 'var(--bg-base)',
  };

  const messagesStyle: React.CSSProperties = {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
  };

  if (!selectedAgent || !agent || !agentState) {
    return <div style={containerStyle}><EmptyState /></div>;
  }

  return (
    <div style={containerStyle}>
      <ChatHeader agent={agent} agentState={agentState} onRun={handleRun} onUseSample={handleUseSample} />
      <div style={messagesStyle}>
        {agentState.messages.map((message, index) => {
          if (message.type === 'user') {
            return <MessageBubble key={index} content={message.content as string} timestamp={message.timestamp} />;
          }
          if (message.type === 'agent') {
            return (
              <AgentBubble
                key={index}
                agent={agent}
                result={message.content as AgentResult}
                processingTime={message.processingTime || 0}
                timestamp={message.timestamp}
              />
            );
          }
          if (message.type === 'error') {
            return (
              <div
                key={index}
                style={{
                  padding: '10px 14px', backgroundColor: 'rgba(255, 23, 68, 0.1)', border: '1px solid var(--red)',
                  borderRadius: 8, color: 'var(--red)', fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                }}
              >
                Error: {message.content as string}
              </div>
            );
          }
          return null;
        })}
        {agentState.status === 'processing' && <ThinkingIndicator agent={agent} />}
        <div ref={messagesEndRef} />
      </div>
      <InputBar agent={agent} onSend={handleSend} onUseSample={handleUseSample} disabled={agentState.status === 'processing'} />
    </div>
  );
};

export default CenterPanel;
