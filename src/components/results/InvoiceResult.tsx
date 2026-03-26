import React from 'react';

const InvoiceResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12 }}>
    <strong>Decision:</strong> {String(result.decision || 'N/A')}
  </div>
);

export default InvoiceResult;
