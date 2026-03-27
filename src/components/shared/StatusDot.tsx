import React from 'react';

interface StatusDotProps {
  status: 'active' | 'idle' | 'warning' | 'error' | 'processing';
  color?: string;
  size?: number;
}

const StatusDot: React.FC<StatusDotProps> = ({ status, color, size = 6 }) => {
  const colors: Record<string, string> = {
    active: 'var(--status-success)',
    idle: 'var(--status-neutral)',
    warning: 'var(--status-warning)',
    error: 'var(--status-danger)',
    processing: color || 'var(--green-primary)',
  };
  const bg = color || colors[status] || colors.idle;
  const pulsing = status === 'active' || status === 'processing';
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'inline-block',
        flexShrink: 0,
        animation: pulsing ? 'greenPulse 2s infinite' : undefined,
      }}
    />
  );
};

export default StatusDot;
