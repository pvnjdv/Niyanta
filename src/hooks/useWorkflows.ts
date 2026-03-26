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

  const saveWorkflow = useCallback(async (payload: Record<string, unknown>) => {
    await createWorkflow(payload);
    await refresh();
  }, [refresh]);

  return { workflows, refresh, saveWorkflow };
}
