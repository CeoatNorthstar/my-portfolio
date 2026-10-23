import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import ThemeToggle from './ThemeToggle';

// Header for full pages (post, paper): a way back, the name, theme.
const TopBar = ({ backTo, backLabel, children }) => (
  <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-md border-b border-line/70">
    <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-5 min-w-0">
        <Link
          to={backTo}
          className="press inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={15} weight="bold" />
          {backLabel}
        </Link>
        <Link to="/" className="hidden sm:block font-serif text-[17px] tracking-tight text-ink truncate">
          Naol Demisse
        </Link>
      </div>
      <div className="flex items-center gap-1">
        {children}
        <ThemeToggle />
      </div>
    </div>
  </header>
);

export default TopBar;
