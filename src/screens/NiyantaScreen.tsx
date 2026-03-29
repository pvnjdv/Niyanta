import React from 'react';
import { NiyantaChatSession } from '../hooks/useNiyantaChat';
import NiyantaChatWorkspace from '../components/chat/NiyantaChatWorkspace';
import { ChatMessage, ExtractedFileAttachment, NiyantaActivityItem } from '../types/message';
import { Agent, AgentState } from '../types/agent';

interface NiyantaScreenProps {
  variant: 'regular' | 'command';
  messages: ChatMessage[];
  isSending: boolean;
  liveActivity: NiyantaActivityItem[];
  onSend: (message: string, attachments?: ExtractedFileAttachment[]) => Promise<void>;
  onNewChat: () => void;
  historySessions: NiyantaChatSession[];
  onRestoreHistory: (sessionId: string) => void;
  onDeleteHistory: (sessionId: string) => void;
  systemSnapshot: {
    activeAgents: number;
    workflowCount: number;
    auditCount: number;
    decisionCount: number;
  };
  agents?: Agent[];
  agentStates?: Record<string, AgentState>;
  workflows?: Array<{ id?: string; name?: string; status?: string; category?: string; updated_at?: string }>;
  metrics?: Record<string, unknown>;
}

const NiyantaScreen: React.FC<NiyantaScreenProps> = ({ variant, ...props }) => {
  const title = variant === 'command' ? 'Niyanta Command' : 'Niyanta AI Console';
  const subtitle = variant === 'command'
    ? 'Central intelligence workspace — live agent status, workflow control, approvals, and operational AI.'
    : 'Dedicated AI workspace for operational questions, reports, and control guidance.';

  return (
    <NiyantaChatWorkspace
      variant={variant}
      title={title}
      subtitle={subtitle}
      {...props}
    />
  );
};

export default NiyantaScreen;