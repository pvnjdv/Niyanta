import { callGroqJSON, MODELS } from '../utils/groqClient';

export abstract class BaseGroqAgent {
  abstract readonly id: string;
  abstract readonly systemPrompt: string;

  async run(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const payload = JSON.stringify(input, null, 2);
    const result = await callGroqJSON<Record<string, unknown>>(this.systemPrompt, payload, MODELS.DEFAULT);
    return {
      ...result,
      _agent: this.id,
      _model: MODELS.DEFAULT,
      _timestamp: new Date().toISOString(),
    };
  }
}
