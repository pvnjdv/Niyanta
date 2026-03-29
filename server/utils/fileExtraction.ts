import XLSX from 'xlsx';

const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text?: string; numpages?: number }>;

export interface UploadedFileLike {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface ExtractedUploadFile {
  name: string;
  size: number;
  type: string;
  excerpt: string;
  textContent: string;
  pageCount?: number;
  sheetNames?: string[];
  extractionStatus: 'ok' | 'unsupported' | 'failed';
  extractionError?: string;
}

function normalizeText(input: string): string {
  return input.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();
}

function isSpreadsheet(name: string, mimeType: string): boolean {
  return /\.(xlsx|xls|csv)$/i.test(name)
    || mimeType.includes('spreadsheet')
    || mimeType.includes('excel')
    || mimeType === 'text/csv';
}

function isTextLike(name: string, mimeType: string): boolean {
  return mimeType.startsWith('text/')
    || mimeType === 'application/json'
    || mimeType === 'application/xml'
    || mimeType === 'application/javascript'
    || /\.(txt|md|csv|json|log|xml|yml|yaml|ts|tsx|js|jsx|html|css)$/i.test(name);
}

function buildExcerpt(text: string): string {
  const normalized = normalizeText(text);
  return normalized.slice(0, 240);
}

function buildFailedExtraction(file: UploadedFileLike, error: unknown, fallbackMessage: string): ExtractedUploadFile {
  const detail = error instanceof Error && error.message
    ? error.message
    : fallbackMessage;

  return {
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
    excerpt: buildExcerpt(`${fallbackMessage} ${detail}`),
    textContent: '',
    extractionStatus: 'failed',
    extractionError: detail,
  };
}

export async function extractUploadedFile(file: UploadedFileLike): Promise<ExtractedUploadFile> {
  const lowerName = file.originalname.toLowerCase();

  if (lowerName.endsWith('.pdf') || file.mimetype === 'application/pdf') {
    try {
      const parsed = await pdfParse(file.buffer);
      const textContent = (parsed.text || '').trim().slice(0, 14000);
      return {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        excerpt: buildExcerpt(textContent),
        textContent,
        pageCount: typeof parsed.numpages === 'number' ? parsed.numpages : undefined,
        extractionStatus: 'ok',
      };
    } catch (error) {
      return buildFailedExtraction(file, error, 'PDF uploaded, but text extraction could not be completed.');
    }
  }

  if (isSpreadsheet(lowerName, file.mimetype)) {
    try {
      if (lowerName.endsWith('.csv') || file.mimetype === 'text/csv') {
        const textContent = file.buffer.toString('utf8').slice(0, 14000);
        return {
          name: file.originalname,
          size: file.size,
          type: file.mimetype,
          excerpt: buildExcerpt(textContent),
          textContent,
          extractionStatus: 'ok',
        };
      }

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      const textContent = sheetNames
        .map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const csv = worksheet ? XLSX.utils.sheet_to_csv(worksheet) : '';
          return `Sheet: ${sheetName}\n${csv}`;
        })
        .join('\n\n')
        .slice(0, 14000);

      return {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        excerpt: buildExcerpt(textContent),
        textContent,
        sheetNames,
        extractionStatus: 'ok',
      };
    } catch (error) {
      return buildFailedExtraction(file, error, 'Spreadsheet uploaded, but text extraction could not be completed.');
    }
  }

  if (isTextLike(lowerName, file.mimetype)) {
    try {
      const textContent = file.buffer.toString('utf8').slice(0, 14000);
      return {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        excerpt: buildExcerpt(textContent),
        textContent,
        extractionStatus: 'ok',
      };
    } catch (error) {
      return buildFailedExtraction(file, error, 'Text file uploaded, but decoding failed.');
    }
  }

  return {
    name: file.originalname,
    size: file.size,
    type: file.mimetype,
    excerpt: 'Binary attachment received. No text was extracted from this file type.',
    textContent: '',
    extractionStatus: 'unsupported',
  };
}