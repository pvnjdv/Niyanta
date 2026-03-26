import React from 'react';

const WorkflowResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12 }}>
    <strong>Analysis:</strong> {String(result.summary || 'N/A')}
  </div>
);

export default WorkflowResult;
