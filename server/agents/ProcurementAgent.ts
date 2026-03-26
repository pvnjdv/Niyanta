export class ProcurementAgent {
  readonly id = 'ProcurementAgent';

  async run(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      status: 'stub',
      agent: this.id,
      input,
      timestamp: new Date().toISOString(),
    };
  }
}
