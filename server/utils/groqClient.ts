import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const MODELS = {
  DEFAULT: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  FAST: process.env.GROQ_FAST_MODEL || 'llama-3.1-8b-instant',
  REASONING: process.env.GROQ_REASONING_MODEL || 'llama-3.3-70b-versatile',
};

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callGroq(
  messages: GroqMessage[],
  model: string = MODELS.DEFAULT,
  maxTokens: number = 2000
): Promise<string> {
  const response = await groq.chat.completions.create({
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
  });

  return response.choices[0]?.message?.content || '';
}

export async function callGroqJSON<T = Record<string, unknown>>(
  systemPrompt: string,
  userContent: string,
  model: string = MODELS.DEFAULT
): Promise<T> {
  const text = await callGroq(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    model,
    2000
  );

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return {
      raw: cleaned,
      summary: 'Model returned non-JSON output',
      parse_error: true,
    } as T;
  }
}

export default groq;
