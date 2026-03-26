import { BaseGroqAgent } from './BaseGroqAgent';

export class DocumentIntelligenceAgent extends BaseGroqAgent {
  readonly id = 'document';
  readonly systemPrompt = `You are the Document Intelligence Agent inside Niyanta AI.
Classify document type, extract fields, validate completeness.
Return strict JSON with document_type, extracted_fields, missing_fields, validation_status, recommended_workflow, audit.`;
}
