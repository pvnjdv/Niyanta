import { useState, useEffect } from 'react';
import { Theme } from '../types/ui';
import { readLocalStorageString, writeLocalStorageString } from '../utils/localStorage';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readLocalStorageString('niyanta-theme', 'dark') as Theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    writeLocalStorageString('niyanta-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggleTheme, isDark: theme === 'dark' };
}
