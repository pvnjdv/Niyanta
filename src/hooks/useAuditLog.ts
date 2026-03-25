import { useState, useCallback } from 'react';
import { AgentId, AuditEntry } from '../types';

interface UseAuditLogReturn {
  log: AuditEntry[];
  addEntry: (agentId: AgentId, message: string, decision?: string | null) => AuditEntry;
  clearLog: () => void;
  filterByAgent: (agentId: AgentId) => AuditEntry[];
  getDecisions: () => AuditEntry[];
}

export function useAuditLog(): UseAuditLogReturn {
  const [log, setLog] = useState<AuditEntry[]>([]);

  const addEntry = useCallback((agentId: AgentId, message: string, decision: string | null = null): AuditEntry => {
    const entry: AuditEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      agentId,
      message,
      decision,
      timestamp: new Date().toISOString(),
      isNew: true,
    };

    setLog((prev) => {
      const newLog = [entry, ...prev];
      // Mark previous entries as not new
      if (newLog.length > 1) {
        newLog[1] = { ...newLog[1], isNew: false };
      }
      // Cap at 200 entries
      return newLog.slice(0, 200);
    });

    // Mark as not new after animation
    setTimeout(() => {
      setLog((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, isNew: false } : e))
      );
    }, 500);

    return entry;
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
  }, []);

  const filterByAgent = useCallback(
    (agentId: AgentId): AuditEntry[] => {
      return log.filter((entry) => entry.agentId === agentId);
    },
    [log]
  );

  const getDecisions = useCallback((): AuditEntry[] => {
    return log.filter((entry) => entry.decision);
  }, [log]);

  return {
    log,
    addEntry,
    clearLog,
    filterByAgent,
    getDecisions,
  };
}
