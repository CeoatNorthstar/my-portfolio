import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

/**
 * Sun/moon theme toggle. Shared across the navbar in all its layouts.
 */
const ThemeToggle = ({ size = 14, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative flex items-center justify-center text-text-3 hover:text-white transition-colors duration-200 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex"
        >
          {isDark ? <Sun size={size} /> : <Moon size={size} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

export default ThemeToggle;
