import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color = 'var(--green-primary)', height = 4 }) => (
  <div style={{ width: '100%', height, background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
    <div
      style={{
        height: '100%',
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color,
        transition: 'width 1s ease',
      }}
    />
  </div>
);

export default ProgressBar;
