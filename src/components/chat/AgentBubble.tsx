import React from 'react';
import AgentIcon from '../shared/AgentIcon';
import Badge from '../shared/Badge';
import MeetingResult from '../results/MeetingResult';
import InvoiceResult from '../results/InvoiceResult';
import HRResult from '../results/HRResult';
import ProcurementResult from '../results/ProcurementResult';
import SecurityResult from '../results/SecurityResult';
import { Agent, AgentResult, AgentId } from '../../types';

interface AgentBubbleProps {
  agent: Agent;
  result: AgentResult;
  processingTime: number;
  timestamp: string;
}

function formatTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ResultContentProps {
  agentId: AgentId;
  result: AgentResult;
}

const ResultContent: React.FC<ResultContentProps> = ({ agentId, result }) => {
  switch (agentId) {
    case 'meeting':
      return <MeetingResult result={result as any} />;
    case 'invoice':
      return <InvoiceResult result={result as any} />;
    case 'hr':
      return <HRResult result={result as any} />;
    case 'procurement':
      return <ProcurementResult result={result as any} />;
    case 'security':
      return <SecurityResult result={result as any} />;
    default:
      return <pre>{JSON.stringify(result, null, 2)}</pre>;
  }
};

const AgentBubble: React.FC<AgentBubbleProps> = ({ agent, result, processingTime, timestamp }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-start',
    animation: 'slideInBottom 0.25s ease',
  };

  const bubbleStyle: React.CSSProperties = {
    maxWidth: '85%',
    backgroundColor: 'var(--bg-msg-in)',
    borderLeft: `3px solid ${agent.color}`,
    borderRadius: '2px 12px 12px 12px',
    padding: '14px 16px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const agentNameStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: agent.color,
  };

  const dotStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: 'var(--text-muted)',
  };

  const timeStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  };

  const processingChipStyle: React.CSSProperties = {
    marginBottom: 10,
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    backgroundColor: 'var(--border-light)',
    margin: '10px 0',
  };

  return (
    <div style={containerStyle}>
      <div style={bubbleStyle}>
        <div style={headerStyle}>
          <AgentIcon agent={agent} size="sm" />
          <span style={agentNameStyle}>{agent.name}</span>
          <span style={dotStyle}>·</span>
          <span style={timeStyle}>{formatTime(timestamp)}</span>
        </div>
        <div style={processingChipStyle}>
          <Badge
            text={`Processed in ${(processingTime / 1000).toFixed(1)}s`}
            type="muted"
            size="sm"
          />
        </div>
        <div style={dividerStyle} />
        <ResultContent agentId={agent.id} result={result} />
      </div>
    </div>
  );
};

export default AgentBubble;
