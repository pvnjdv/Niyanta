import { useState, useEffect } from 'react';
import { Theme } from '../types/ui';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('niyanta-theme') as Theme) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('niyanta-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
