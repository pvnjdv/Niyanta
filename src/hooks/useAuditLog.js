import { useState, useCallback } from 'react';

export function useAuditLog() {
  const [log, setLog] = useState([]);

  const addEntry = useCallback((agentId, message, decision = null) => {
    const entry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      agentId,
      message,
      decision,
      timestamp: new Date().toISOString(),
      isNew: true,
    };

    setLog(prev => {
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
      setLog(prev =>
        prev.map(e => (e.id === entry.id ? { ...e, isNew: false } : e))
      );
    }, 500);

    return entry;
  }, []);

  const clearLog = useCallback(() => {
    setLog([]);
  }, []);

  const filterByAgent = useCallback(
    (agentId) => {
      return log.filter(entry => entry.agentId === agentId);
    },
    [log]
  );

  const getDecisions = useCallback(() => {
    return log.filter(entry => entry.decision);
  }, [log]);

  return {
    log,
    addEntry,
    clearLog,
    filterByAgent,
    getDecisions,
  };
}
