import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import photo from '../../assets/naol.jpg';
import { SITE } from '../../lib/site';
import ThemeToggle from '../ui/ThemeToggle';
import Feynman from '../ui/Feynman';
import CardView from './CardViews';

export const NAV = [
  { key: 'about', label: 'About' },
  { key: 'blog', label: 'Blog' },
  { key: 'papers', label: 'Papers' },
  { key: 'contact', label: 'Contact' },
  { key: 'donate', label: 'Donate' },
];

const Identity = ({ className = '' }) => (
  <div className={className}>
    <h1 className="font-serif text-[26px] sm:text-[31px] leading-[1.05] tracking-[-0.02em] text-ink">{SITE.name}</h1>
    <p className="label mt-2">{SITE.role}</p>
  </div>
);

/**
 * The business card. Photo, name and role never change; the information
 * area next to the photo swaps with the nav (About, Contact). Blog, Papers
 * and Donate open as a panel beside the card.
 * Double-click the photo to turn the card over.
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
              <button
                type="button"
                onClick={onHome}
                onDoubleClick={() => setFlipped(true)}
                aria-label="Home"
                className="block rounded-md overflow-hidden shrink-0 focus-visible:outline-offset-4"
              >
                <img
                  src={photo}
                  alt={SITE.name}
                  width="148"
                  height="184"
                  draggable="false"
                  className="w-[68px] h-[68px] sm:w-[148px] sm:h-[184px] object-cover [filter:saturate(0.82)_sepia(0.06)] hover:[filter:none] transition-[filter] duration-500"
                />
              </button>
              <Identity className="sm:hidden" />
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <Identity className="hidden sm:block pr-14" />
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
                    className={`press relative px-[7px] sm:px-3 h-8 rounded-md text-[13px] sm:text-[13.5px] whitespace-nowrap transition-colors ${
                      isActive(item.key) ? 'text-ink' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {item.label}
                    {item.key === 'papers' && newPaper && (
                      <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-new-fg" title="New paper" />
                    )}
                    {isActive(item.key) && (
                      <motion.span
                        layoutId={['blog', 'papers', 'donate'].includes(item.key) ? 'nav-panel' : 'nav-view'}
                        className="absolute left-[7px] right-[7px] sm:left-3 sm:right-3 bottom-[3px] h-px bg-ink"
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
