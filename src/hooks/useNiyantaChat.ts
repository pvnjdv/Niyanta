import { useState, useCallback, useEffect } from 'react';
import { NiyantaSystemContext, sendNiyantaMessage } from '../services/api';
import { ChatMessage, ExtractedFileAttachment, NiyantaActivityItem } from '../types/message';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';

const CURRENT_CHAT_KEY = 'niyanta-chat-current';
const CHAT_HISTORY_KEY = 'niyanta-chat-history';

export interface NiyantaChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

function buildAttachmentContext(attachments: ExtractedFileAttachment[]): string {
  return attachments
    .map((file, index) => {
      const descriptor = [
        `File ${index + 1}: ${file.name}`,
        `Type: ${file.type || 'unknown'}`,
        `Size: ${Math.max(1, Math.round(file.size / 1024))} KB`,
        file.pageCount ? `Pages: ${file.pageCount}` : '',
        Array.isArray(file.sheetNames) && file.sheetNames.length > 0 ? `Sheets: ${file.sheetNames.join(', ')}` : '',
        `Excerpt: ${file.excerpt || 'No preview available.'}`,
        file.textContent ? `Extracted Content:\n${file.textContent}` : 'No extractable text was available for this file.',
      ].filter(Boolean);
      return descriptor.join('\n');
    })
    .join('\n\n');
}

function buildLocalActivity(
  systemContext: NiyantaSystemContext,
  agentResults: Record<string, unknown>,
  attachments: ExtractedFileAttachment[]
): NiyantaActivityItem[] {
  const now = Date.now();
  const liveReports = Object.keys(agentResults || {}).length;
  return [
    {
      id: 'local-intake',
      label: 'Input staged',
      detail: `Captured request and ${attachments.length} attachment${attachments.length === 1 ? '' : 's'} for analysis.`,
      tone: 'info',
      timestamp: new Date(now).toISOString(),
    },
    {
      id: 'local-reports',
      label: 'Reports loading',
      detail: `Syncing ${systemContext.workflows.length} workflows, ${systemContext.auditTrail.length} audit events, and ${liveReports} live agent result${liveReports === 1 ? '' : 's'}.`,
      tone: 'info',
      timestamp: new Date(now + 150).toISOString(),
    },
    {
      id: 'local-compose',
      label: 'Niyanta thinking',
      detail: `Correlating ${systemContext.agents.length} agents against the current control-plane state.`,
      tone: 'success',
      timestamp: new Date(now + 300).toISOString(),
    },
  ];
}

export function useNiyantaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalStorage<ChatMessage[]>(CURRENT_CHAT_KEY, []));
  const [isSending, setIsSending] = useState(false);
  const [historySessions, setHistorySessions] = useState<NiyantaChatSession[]>(() => readLocalStorage<NiyantaChatSession[]>(CHAT_HISTORY_KEY, []));
  const [liveActivity, setLiveActivity] = useState<NiyantaActivityItem[]>([]);

  useEffect(() => {
    writeLocalStorage(CURRENT_CHAT_KEY, messages);
  }, [messages]);

  useEffect(() => {
    writeLocalStorage(CHAT_HISTORY_KEY, historySessions);
  }, [historySessions]);

  const sendMessage = useCallback(async (
    message: string,
    agentResults: Record<string, unknown>,
    systemContext: NiyantaSystemContext,
    attachments: ExtractedFileAttachment[] = []
  ) => {
    setIsSending(true);
    const timestamp = new Date().toISOString();
    const baseMessage = message.trim() || 'Analyze the attached files and summarize the operational impact.';
    const pendingActivity = buildLocalActivity(systemContext, agentResults, attachments);
    const requestMessage = attachments.length > 0
      ? `${baseMessage}\n\n[Attached Files]\n${buildAttachmentContext(attachments)}`
      : baseMessage;

    setMessages((prev) => [...prev, {
      role: 'user',
      content: baseMessage,
      timestamp,
      attachments: attachments.length > 0 ? attachments : undefined,
    }]);
    setLiveActivity([]);

    const timers = pendingActivity.map((activity, index) => window.setTimeout(() => {
      setLiveActivity((prev) => prev.some((item) => item.id === activity.id) ? prev : [...prev, activity]);
    }, index * 220));

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendNiyantaMessage(requestMessage, history, agentResults, systemContext);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: response.reply,
        timestamp: response.timestamp,
        activity: response.activity,
        reports: response.reports,
      }]);
      setLiveActivity(response.activity && response.activity.length > 0 ? response.activity : pendingActivity);
    } catch (error) {
      const failureTimestamp = new Date().toISOString();
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Niyanta chat failed',
        timestamp: failureTimestamp,
      }]);
      setLiveActivity([
        ...pendingActivity,
        {
          id: 'local-error',
          label: 'Response failed',
          detail: error instanceof Error ? error.message : 'Niyanta chat failed unexpectedly.',
          tone: 'danger',
          timestamp: failureTimestamp,
        },
      ]);
    } finally {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      setIsSending(false);
    }
  }, [messages]);

  const startNewChat = useCallback(() => {
    setLiveActivity([]);
    setMessages((prev) => {
      if (prev.length > 0) {
        const firstUser = prev.find((m) => m.role === 'user')?.content || 'Untitled chat';
        const title = firstUser.length > 46 ? `${firstUser.slice(0, 46)}...` : firstUser;
        const session: NiyantaChatSession = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          timestamp: new Date().toISOString(),
          messages: prev,
        };
        setHistorySessions((hist) => [session, ...hist].slice(0, 20));
      }
      return [];
    });
  }, []);

  const restoreFromHistory = useCallback((sessionId: string) => {
    setHistorySessions((hist) => {
      const session = hist.find((s) => s.id === sessionId);
      if (session) setMessages(session.messages);
      return hist;
    });
  }, []);

  const deleteHistorySession = useCallback((sessionId: string) => {
    setHistorySessions((hist) => hist.filter((s) => s.id !== sessionId));
  }, []);

  return {
    messages,
    isSending,
    sendMessage,
    startNewChat,
    historySessions,
    restoreFromHistory,
    deleteHistorySession,
    liveActivity,
  };
}
