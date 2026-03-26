import { useState, useCallback } from 'react';
import { sendNiyantaMessage } from '../services/api';
import { ChatMessage } from '../types/message';

export function useNiyantaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

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

  return { messages, isSending, sendMessage };
}
