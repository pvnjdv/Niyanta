export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toErrorMessage(error: unknown, fallback: string = 'Unknown error'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function clipText(input: string, max: number = 240): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max)}...`;
}
