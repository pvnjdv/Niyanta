export class DocumentIntelligenceAgent {
  readonly id = 'DocumentIntelligenceAgent';

  async run(input: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {
      status: 'stub',
      agent: this.id,
      input,
      timestamp: new Date().toISOString(),
    };
  }
}
