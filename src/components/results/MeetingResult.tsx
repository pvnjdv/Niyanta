import React from 'react';

const MeetingResult: React.FC<{ result: Record<string, unknown> }> = ({ result }) => (
  <div style={{ fontSize: 12 }}>
    <strong>Summary:</strong> {String(result.summary || 'N/A')}
  </div>
);

export default MeetingResult;
