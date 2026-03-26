import { useState, useEffect, useCallback } from 'react';
import { fetchMetrics } from '../services/api';

export function useMetrics() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});

  const refresh = useCallback(async () => {
    const data = await fetchMetrics();
    setMetrics(data || {});
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  return { metrics, refresh };
}
