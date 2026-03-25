import { useState, useCallback } from 'react';
import { sendNiyantaMessage as apiSendMessage } from '../services/api';
import { ChatMessage, AgentId, AgentResult } from '../types';

interface UseNiyantaChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (
    text: string,
    agentResults: Partial<Record<AgentId, AgentResult | null>>
  ) => Promise<ChatMessage>;
  clearChat: () => void;
}

export function useNiyantaChat(): UseNiyantaChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (
      text: string,
      agentResults: Partial<Record<AgentId, AgentResult | null>>
    ): Promise<ChatMessage> => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Build conversation history for API
        const conversationHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await apiSendMessage(text, conversationHistory, agentResults);

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.reply,
          timestamp: response.timestamp,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return assistantMessage;
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          isError: true,
        };

        setMessages((prev) => [...prev, errorMessage]);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat,
  };
}
