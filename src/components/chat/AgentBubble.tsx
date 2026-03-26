import React from 'react';
import { Message } from '../../types/agent';
import MeetingResult from '../results/MeetingResult';
import InvoiceResult from '../results/InvoiceResult';
import HRResult from '../results/HRResult';
import ProcurementResult from '../results/ProcurementResult';
import SecurityResult from '../results/SecurityResult';
import WorkflowResult from '../results/WorkflowResult';
import ComplianceResult from '../results/ComplianceResult';

interface AgentBubbleProps {
  message: Message;
  agentId: string;
}

const AgentBubble: React.FC<AgentBubbleProps> = ({ message, agentId }) => {
  const result = message.result || {};

  const renderResult = () => {
    if (agentId === 'meeting') return <MeetingResult result={result} />;
    if (agentId === 'invoice') return <InvoiceResult result={result} />;
    if (agentId === 'hr') return <HRResult result={result} />;
    if (agentId === 'procurement') return <ProcurementResult result={result} />;
    if (agentId === 'security') return <SecurityResult result={result} />;
    if (agentId === 'workflow') return <WorkflowResult result={result} />;
    if (agentId === 'compliance') return <ComplianceResult result={result} />;
    return <div style={{ fontSize: 12 }}>{JSON.stringify(result)}</div>;
  };

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '82%', background: 'var(--bg-msg-in)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 13, marginBottom: 8 }}>{message.content}</div>
      {renderResult()}
    </div>
  );
};

export default AgentBubble;
