import React from 'react';

const ComplianceResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12 }}>
    <strong>Status:</strong> {String(result.compliance_status || 'N/A')}
  </div>
);

export default ComplianceResult;
