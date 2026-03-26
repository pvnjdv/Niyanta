import React from 'react';
import { Theme } from '../../types/ui';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => (
  <button onClick={onToggle} style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
    {theme === 'dark' ? 'Light' : 'Dark'}
  </button>
);

export default ThemeToggle;
