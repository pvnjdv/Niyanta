import React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
}

const Badge: React.FC<BadgeProps> = ({ text, color = 'var(--accent)' }) => (
  <span style={{ padding: '2px 8px', borderRadius: 999, border: `1px solid ${color}`, color, fontSize: 11, fontWeight: 700 }}>
    {text}
  </span>
);

export default Badge;
