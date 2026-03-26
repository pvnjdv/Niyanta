import { useEffect, useState, useCallback } from 'react';
import { fetchAuditLog } from '../services/api';

export function useAuditLog() {
  const [entries, setEntries] = useState<unknown[]>([]);
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    const data = await fetchAuditLog();
    setEntries(data.entries || []);
    setTotal(data.total || 0);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return { entries, total, refresh };
}
