import { useState, useEffect, useCallback } from 'react';
import { createWorkflow, fetchWorkflows } from '../services/api';
import { WorkflowDefinition } from '../types/workflow';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);

  const refresh = useCallback(async () => {
    const data = await fetchWorkflows();
    setWorkflows((data.workflows || []) as WorkflowDefinition[]);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh().catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const saveWorkflow = useCallback(async (payload: Record<string, unknown>) => {
    await createWorkflow(payload);
    await refresh();
  }, [refresh]);

  return { workflows, refresh, saveWorkflow };
}
