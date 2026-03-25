import React, { useState, useEffect } from 'react';

interface SystemStatusProps {
  isAnyProcessing: boolean;
  processingAgentName: string | null;
  agentColor?: string | null;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  isAnyProcessing,
  processingAgentName,
  agentColor,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const containerStyle: React.CSSProperties = {
    height: 32,
    backgroundColor: 'var(--accent-dim)',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const leftStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const dotStyle: React.CSSProperties = {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: isAnyProcessing ? (agentColor || 'var(--amber)') : 'var(--green)',
    animation: 'pulse 2s ease-in-out infinite',
  };

  const textStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
  };

  const timeStyle: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: 9,
    color: 'var(--text-muted)',
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div style={containerStyle}>
      <div style={leftStyle}>
        <div style={dotStyle} />
        <span style={textStyle}>
          {isAnyProcessing
            ? `PROCESSING: ${processingAgentName?.toUpperCase()}...`
            : 'ALL SYSTEMS OPERATIONAL'}
        </span>
      </div>
      <span style={timeStyle}>{formatTime(time)}</span>
    </div>
  );
};

export default SystemStatus;
