import { useState, useCallback, useEffect } from 'react';
import { sendNiyantaMessage } from '../services/api';
import { ChatMessage } from '../types/message';
import { readLocalStorage, writeLocalStorage } from '../utils/localStorage';

const CURRENT_CHAT_KEY = 'niyanta-chat-current';
const CHAT_HISTORY_KEY = 'niyanta-chat-history';

export interface NiyantaChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export function useNiyantaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => readLocalStorage<ChatMessage[]>(CURRENT_CHAT_KEY, []));
  const [isSending, setIsSending] = useState(false);
  const [historySessions, setHistorySessions] = useState<NiyantaChatSession[]>(() => readLocalStorage<NiyantaChatSession[]>(CHAT_HISTORY_KEY, []));

  useEffect(() => {
    writeLocalStorage(CURRENT_CHAT_KEY, messages);
  }, [messages]);

  useEffect(() => {
    writeLocalStorage(CHAT_HISTORY_KEY, historySessions);
  }, [historySessions]);

  const sendMessage = useCallback(async (message: string, agentResults: Record<string, unknown>) => {
    setIsSending(true);
    const timestamp = new Date().toISOString();
    setMessages((prev) => [...prev, { role: 'user', content: message, timestamp }]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendNiyantaMessage(message, history, agentResults);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.reply, timestamp: response.timestamp }]);
    } finally {
      setIsSending(false);
    }
  }, [messages]);

  const startNewChat = useCallback(() => {
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
  };
}
