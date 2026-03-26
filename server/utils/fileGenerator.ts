import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

export type ExportType = 'excel' | 'csv' | 'json' | 'pdf' | 'txt';

export interface GeneratedFile {
  id: string;
  name: string;
  type: ExportType;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export function generateJsonFile(baseDir: string, name: string, payload: unknown): GeneratedFile {
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const id = uuid();
  const fileName = `${name}-${id}.json`;
  const outputPath = path.join(baseDir, fileName);
  const content = JSON.stringify(payload, null, 2);
  fs.writeFileSync(outputPath, content, 'utf-8');

  return {
    id,
    name: fileName,
    type: 'json',
    path: outputPath,
    sizeBytes: Buffer.byteLength(content, 'utf-8'),
    createdAt: new Date().toISOString(),
  };
}
