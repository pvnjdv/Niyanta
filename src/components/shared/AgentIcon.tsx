import React from 'react';

interface AgentIconProps {
  icon: string;
  color: string;
  glow: string;
  size?: number;
  processing?: boolean;
}

const AgentIcon: React.FC<AgentIconProps> = ({ icon, color, glow, size = 40, processing = false }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      border: `1px solid ${color}`,
      background: glow,
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      color,
      boxShadow: processing ? `0 0 0 6px ${glow}` : 'none',
      animation: processing ? 'pulse 1.2s infinite' : undefined,
    }}
  >
    {icon}
  </div>
);

export default AgentIcon;
