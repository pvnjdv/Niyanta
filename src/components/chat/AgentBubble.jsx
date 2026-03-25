import React from 'react';
import AgentIcon from '../shared/AgentIcon';
import Badge from '../shared/Badge';
import MeetingResult from '../results/MeetingResult';
import InvoiceResult from '../results/InvoiceResult';
import HRResult from '../results/HRResult';
import ProcurementResult from '../results/ProcurementResult';
import SecurityResult from '../results/SecurityResult';

function formatTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ResultContent({ agentId, result }) {
  switch (agentId) {
    case 'meeting':
      return <MeetingResult result={result} />;
    case 'invoice':
      return <InvoiceResult result={result} />;
    case 'hr':
      return <HRResult result={result} />;
    case 'procurement':
      return <ProcurementResult result={result} />;
    case 'security':
      return <SecurityResult result={result} />;
    default:
      return <pre>{JSON.stringify(result, null, 2)}</pre>;
  }
}

export default function AgentBubble({ agent, result, processingTime, timestamp }) {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'flex-start',
    animation: 'slideInBottom 0.25s ease',
  };

  const bubbleStyle = {
    maxWidth: '85%',
    backgroundColor: 'var(--bg-msg-in)',
    borderLeft: `3px solid ${agent.color}`,
    borderRadius: '2px 12px 12px 12px',
    padding: '14px 16px',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  };

  const agentNameStyle = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    textTransform: 'uppercase',
    color: agent.color,
  };

  const dotStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 11,
    color: 'var(--text-muted)',
  };

  const timeStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  };

  const processingChipStyle = {
    marginBottom: 10,
  };

  const dividerStyle = {
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
}
