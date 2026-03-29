import { useState, useCallback } from 'react';
import { sendNiyantaMessage } from '../services/api';
import { ChatMessage } from '../types/message';

export interface NiyantaChatSession {
  id: string;
  title: string;
  timestamp: string;
  messages: ChatMessage[];
}

export function useNiyantaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [historySessions, setHistorySessions] = useState<NiyantaChatSession[]>([]);

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

  return { messages, isSending, sendMessage, startNewChat, historySessions, restoreFromHistory };
}
