import React, { useRef, useEffect, useState } from 'react';
import { AGENTS } from '../../constants/agents';
import { SAMPLES } from '../../constants/samples';
import EmptyState from '../chat/EmptyState';
import ChatHeader from '../chat/ChatHeader';
import MessageBubble from '../chat/MessageBubble';
import AgentBubble from '../chat/AgentBubble';
import ThinkingIndicator from '../chat/ThinkingIndicator';
import InputBar from '../chat/InputBar';

export default function CenterPanel({ selectedAgent, agentStates, onRunAgent }) {
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  const agent = selectedAgent ? AGENTS[selectedAgent] : null;
  const agentState = selectedAgent ? agentStates[selectedAgent] : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentState?.messages]);

  const handleSend = (text) => {
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
    if (inputValue.trim() && selectedAgent) {
      onRunAgent(selectedAgent, inputValue.trim());
      setInputValue('');
    }
  };

  const containerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    minWidth: 0,
    backgroundColor: 'var(--bg-base)',
  };

  const messagesStyle = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  if (!selectedAgent) {
    return (
      <div style={containerStyle}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <ChatHeader
        agent={agent}
        agentState={agentState}
        onRun={handleRun}
        onUseSample={handleUseSample}
      />
      <div style={messagesStyle}>
        {agentState?.messages.map((message, index) => {
          if (message.type === 'user') {
            return (
              <MessageBubble
                key={index}
                content={message.content}
                timestamp={message.timestamp}
              />
            );
          }
          if (message.type === 'agent') {
            return (
              <AgentBubble
                key={index}
                agent={agent}
                result={message.content}
                processingTime={message.processingTime}
                timestamp={message.timestamp}
              />
            );
          }
          if (message.type === 'error') {
            return (
              <div
                key={index}
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 23, 68, 0.1)',
                  border: '1px solid var(--red)',
                  borderRadius: 8,
                  color: 'var(--red)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                }}
              >
                Error: {message.content}
              </div>
            );
          }
          return null;
        })}
        {agentState?.status === 'processing' && (
          <ThinkingIndicator agent={agent} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <InputBar
        agent={agent}
        onSend={handleSend}
        onUseSample={handleUseSample}
        disabled={agentState?.status === 'processing'}
      />
    </div>
  );
}
