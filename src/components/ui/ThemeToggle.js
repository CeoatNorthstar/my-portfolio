import { Moon, Sun } from '@phosphor-icons/react';
import useTheme from '../../hooks/useTheme';
import IconButton from './IconButton';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  return (
    <IconButton label={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggleTheme} className={className}>
      {theme === 'dark' ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
    </IconButton>
  );
};

export default ThemeToggle;
