import React from 'react';

const TYPE_COLORS = {
  success: 'var(--green)',
  warning: 'var(--amber)',
  danger: 'var(--red)',
  info: '#00D4FF',
  muted: 'var(--text-muted)',
};

const SIZES = {
  sm: { fontSize: '10px', padding: '2px 6px' },
  md: { fontSize: '11px', padding: '3px 8px' },
  lg: { fontSize: '13px', padding: '4px 10px' },
};

export default function Badge({ text, type = 'muted', color, size = 'sm' }) {
  const badgeColor = type === 'custom' ? color : TYPE_COLORS[type];
  const sizeStyles = SIZES[size];

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: "'Space Mono', monospace",
    fontSize: sizeStyles.fontSize,
    padding: sizeStyles.padding,
    borderRadius: '2px',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    backgroundColor: `color-mix(in srgb, ${badgeColor} 15%, transparent)`,
    color: badgeColor,
    whiteSpace: 'nowrap',
  };

  return <span style={style}>{text}</span>;
}
