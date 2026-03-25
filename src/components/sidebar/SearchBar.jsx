import React from 'react';

export default function SearchBar({ value, onChange }) {
  const containerStyle = {
    position: 'relative',
    width: '100%',
  };

  const inputStyle = {
    width: '100%',
    height: 36,
    borderRadius: 20,
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    paddingLeft: 36,
    paddingRight: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  const iconStyle = {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    color: 'var(--text-muted)',
  };

  return (
    <div style={containerStyle}>
      <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        style={inputStyle}
        placeholder="Search agents..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
