import React from 'react';
import { NiyantaChatSession } from '../hooks/useNiyantaChat';
import NiyantaChatWorkspace from '../components/chat/NiyantaChatWorkspace';
import { ChatMessage, ExtractedFileAttachment, NiyantaActivityItem } from '../types/message';

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
}

const NiyantaScreen: React.FC<NiyantaScreenProps> = ({ variant, ...props }) => {
  const title = variant === 'command' ? 'Niyanta Command Workspace' : 'Niyanta AI Console';
  const subtitle = variant === 'command'
    ? 'Central command view with live reports, activity tape, and uploaded file analysis.'
    : 'Dedicated routed Niyanta workspace for operational questions, reports, and control guidance.';

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