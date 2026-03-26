export class SecurityMonitorAgent {
  readonly id = 'SecurityMonitorAgent';

  async run(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      status: 'stub',
      agent: this.id,
      input,
      timestamp: new Date().toISOString(),
    };
  }
}
