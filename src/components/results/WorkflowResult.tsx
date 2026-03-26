import React from 'react';

const WorkflowResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => {
  const suggestions = (result.optimization_suggestions as Array<Record<string, unknown>>) || [];
  const bottlenecks = (result.workflow_analysis as Record<string, unknown>)?.bottleneck_nodes as string[] | undefined;
  const routes = (result.routing_recommendations as Array<Record<string, unknown>>) || [];

  return (
    <div style={{ display: 'grid', gap: 10, fontSize: 12 }}>
      <div><strong>{String(result.summary || 'Workflow Analysis')}</strong></div>
      <div><strong>Bottlenecks:</strong> {(bottlenecks || []).join(', ') || 'None reported'}</div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Optimization Suggestions</div>
        {suggestions.map((s, i) => <div key={i}>{String(s.type || 'OPT')}: {String(s.description || '')}</div>)}
      </div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Routing Recommendations</div>
        {routes.map((r, i) => <div key={i}>{String(r.from_node || '')} → {String(r.to_node || '')} ({String(r.condition || 'always')})</div>)}
      </div>
    </div>
  );
};

export default WorkflowResult;
