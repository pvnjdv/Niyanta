import { v4 as uuid } from 'uuid';
import { getDB } from '../db/database';

interface AuditEntry {
  agentId?: string;
  eventType: string;
  event: string;
  decision?: string;
  inputPreview?: string;
  processingTime?: number;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  log(entry: AuditEntry): void {
    const db = getDB();
    db.prepare(`
      INSERT INTO audit_logs (id, agent_id, event_type, event, decision, input_preview, processing_time_ms, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid(),
      entry.agentId || null,
      entry.eventType,
      entry.event,
      entry.decision || null,
      entry.inputPreview || null,
      entry.processingTime || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      new Date().toISOString()
    );
  }

  getRecent(limit: number = 100): unknown[] {
    const db = getDB();
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  getByAgent(agentId: string, limit: number = 50): unknown[] {
    const db = getDB();
    return db.prepare('SELECT * FROM audit_logs WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?').all(agentId, limit);
  }

  getDecisions(limit: number = 50): unknown[] {
    const db = getDB();
    return db
      .prepare("SELECT * FROM audit_logs WHERE decision IS NOT NULL AND decision != '' ORDER BY timestamp DESC LIMIT ?")
      .all(limit);
  }
}
