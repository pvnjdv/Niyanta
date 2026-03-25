import React from 'react';

function formatTime(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessageBubble({ content, timestamp }) {
  const containerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    animation: 'slideInBottom 0.25s ease',
  };

  const wrapperStyle = {
    maxWidth: '65%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  };

  const labelStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    marginBottom: 4,
    textAlign: 'right',
  };

  const bubbleStyle = {
    backgroundColor: 'var(--bg-msg-out)',
    border: '1px solid var(--border)',
    borderRadius: '12px 12px 2px 12px',
    padding: '10px 14px',
  };

  const contentStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  };

  const timeStyle = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
    marginTop: 4,
    textAlign: 'right',
  };

  // Truncate very long content for display
  const displayContent =
    content.length > 500 ? content.substring(0, 500) + '...' : content;

  return (
    <div style={containerStyle}>
      <div style={wrapperStyle}>
        <div style={labelStyle}>YOU · INPUT</div>
        <div style={bubbleStyle}>
          <div style={contentStyle}>{displayContent}</div>
        </div>
        <div style={timeStyle}>{formatTime(timestamp)}</div>
      </div>
    </div>
  );
}
