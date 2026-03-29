export type NiyantaTone = 'info' | 'success' | 'warning' | 'danger';

export interface NiyantaActivityItem {
  id: string;
  label: string;
  detail: string;
  tone: NiyantaTone;
  timestamp: string;
}

export interface NiyantaReportCard {
  id: string;
  title: string;
  value: string;
  detail: string;
  tone: NiyantaTone;
}

export interface ExtractedFileAttachment {
  name: string;
  size: number;
  type: string;
  excerpt: string;
  textContent?: string;
  pageCount?: number;
  sheetNames?: string[];
  extractionStatus?: 'ok' | 'unsupported';
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  activity?: NiyantaActivityItem[];
  reports?: NiyantaReportCard[];
  attachments?: ExtractedFileAttachment[];
}
