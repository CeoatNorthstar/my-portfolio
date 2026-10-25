import { useCallback, useEffect, useState } from 'react';
import { store } from '../lib/storage';

// Only an explicit pick from the toggle is remembered; everyone else gets
// the default (dark). The old `theme` key was written automatically, so it
// is ignored.
const STORAGE_KEY = 'theme-choice';

const getInitialTheme = () => {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  const stored = store.get(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
};

/**
 * Theme controller. Reflects the theme on <html data-theme>; the initial
 * attribute is set by an inline script in index.html to avoid a flash.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      store.set(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggleTheme, setTheme };
}
