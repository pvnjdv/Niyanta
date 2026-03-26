export class MonitoringAgent {
  readonly id = 'MonitoringAgent';

  async run(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      status: 'stub',
      agent: this.id,
      input,
      timestamp: new Date().toISOString(),
    };
  }
}
