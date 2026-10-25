import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SITE } from '../../lib/site';
import ThemeToggle from '../ui/ThemeToggle';
import Feynman from '../ui/Feynman';
import CardView from './CardViews';
import Spacetime from './Spacetime';

export const NAV = [
  { key: 'about', label: 'About' },
  { key: 'blog', label: 'Blog' },
  { key: 'papers', label: 'Papers' },
  { key: 'data', label: 'Data' },
  { key: 'contact', label: 'Contact' },
  { key: 'donate', label: 'Donate' },
];

const Identity = ({ className = '', onHome, onFlip }) => (
  <div className={className}>
    <h1 className="font-serif text-[26px] sm:text-[31px] leading-[1.05] tracking-[-0.02em] text-ink">
      <button type="button" onClick={onHome} onDoubleClick={onFlip} className="text-left select-none">
        {SITE.name}
      </button>
    </h1>
    <p className="label mt-2">{SITE.role}</p>
  </div>
);

/**
 * The business card. The spacetime patch, name and role never change; the
 * information area beside them swaps with the nav (About, Contact). Blog,
 * Papers, Data and Donate open as a panel beside the card.
 * Double-click the name to turn the card over.
 */
const Card = ({ view, panel, compact, newPaper, onNav, onHome }) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!flipped) return undefined;
    const onKey = (e) => e.key === 'Escape' && setFlipped(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped]);

  const isActive = (key) => key === panel || key === view;

  return (
    <div className={`flip-scene w-full sm:w-[600px] max-w-full ${compact ? 'lg:w-[520px] xl:w-[600px]' : ''}`}>
      <div className={`flip-inner ${flipped ? 'is-flipped' : ''}`}>
        {/* Front */}
        <article className="flip-face relative bg-card border border-line rounded-xl shadow-card sm:h-[376px] flex flex-col overflow-hidden">
          <Feynman className="hidden sm:block absolute top-6 right-6 w-12 text-ink opacity-[0.16]" />

          <div className="flex-1 min-h-0 p-5 sm:p-7 flex flex-col sm:flex-row gap-5 sm:gap-7">
            <div className="flex sm:block items-center gap-4 shrink-0">
              <Spacetime className="w-[68px] h-[68px] sm:w-[148px] sm:h-[184px] shrink-0" />
              <Identity className="sm:hidden" onHome={onHome} onFlip={() => setFlipped(true)} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <Identity className="hidden sm:block pr-14" onHome={onHome} onFlip={() => setFlipped(true)} />
              <div className="hidden sm:block w-8 h-px bg-ink/20 my-5" />
              <div className="relative flex-1 min-h-0">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full"
                  >
                    <CardView view={view} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <nav className="border-t border-line h-[52px] shrink-0 pl-1.5 sm:pl-4 pr-1.5 sm:pr-2 flex items-center justify-between gap-1">
            <ul className="flex items-center min-w-0 overflow-x-auto no-scrollbar">
              {NAV.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => onNav(item.key)}
                    aria-current={isActive(item.key) ? 'true' : undefined}
                    className={`press relative px-[5px] sm:px-3 h-8 rounded-md text-[12.5px] sm:text-[13.5px] whitespace-nowrap transition-colors ${
                      isActive(item.key) ? 'text-ink' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {item.key === 'papers' && newPaper && (
                      <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-new-fg" title="New paper" />
                    )}
                    {isActive(item.key) && (
                      <motion.span
                        layoutId={['blog', 'papers', 'data', 'donate'].includes(item.key) ? 'nav-panel' : 'nav-view'}
                        className="absolute left-[5px] right-[5px] sm:left-3 sm:right-3 bottom-[3px] h-px bg-ink"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </nav>
        </article>

        {/* Back */}
        <article
          className="flip-face flip-back bg-card border border-line rounded-xl shadow-card flex flex-col items-center justify-center text-center p-8 select-none"
          onDoubleClick={() => setFlipped(false)}
          aria-hidden={!flipped}
        >
          <Feynman className="w-28 text-ink opacity-60" />
          <p className="mt-8 font-serif italic text-[24px] sm:text-[28px] tracking-[-0.01em] text-ink">{SITE.motto}</p>
          <p className="label mt-4">e⁻ e⁺ → γ → e⁻ e⁺</p>
          <button type="button" onClick={() => setFlipped(false)} className="mt-8 text-[12px] text-ink-3 hover:text-ink">
            Turn the card back over
          </button>
        </article>
      </div>
    </div>
  );
};

export default Card;
