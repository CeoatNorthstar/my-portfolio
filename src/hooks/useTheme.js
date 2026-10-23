import { useCallback, useEffect, useState } from 'react';
import { store } from '../lib/storage';

const STORAGE_KEY = 'theme';

const getInitialTheme = () => {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  const stored = store.get(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Theme controller. Persists to localStorage and reflects the choice on
 * <html data-theme>. The initial attribute is set by an inline script in
 * index.html to avoid a flash before React mounts.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    store.set(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { theme, toggleTheme, setTheme };
}
