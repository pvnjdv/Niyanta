import React, { useState } from 'react';

export default function ThemeToggle({ theme, onToggle }) {
  const [isHovered, setIsHovered] = useState(false);

  const style = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: isHovered ? 'var(--bg-hover)' : 'var(--accent-dim)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    fontSize: 14,
  };

  return (
    <button
      style={style}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
