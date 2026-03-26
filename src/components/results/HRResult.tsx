import React from 'react';

const HRResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12 }}>
    <strong>Employee:</strong> {JSON.stringify(result.employee || {})}
  </div>
);

export default HRResult;
