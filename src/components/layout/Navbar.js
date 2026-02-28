import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NAV_ITEMS } from '../../lib/constants';

/**
 * Dynamic Island Navbar
 *
 * - At top (scrollY < 80): Full-width transparent bar
 * - On scroll: Detaches, shrinks, floats as a centered pill (Dynamic Island)
 * - Hides on scroll down, reappears on scroll up
 * - Smooth spring-based morphing animation
 */
const Navbar = () => {
  const [phase, setPhase] = useState('full'); // 'full' | 'island'
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = lastScrollY.current;

    if (latest < 80) {
      setPhase('full');
      setHidden(false);
      setExpanded(false);
    } else {
      setPhase('island');
      if (latest > prev + 5 && latest > 200) {
        setHidden(true);
        setExpanded(false);
      } else if (prev > latest + 5) {
        setHidden(false);
      }
    }
    lastScrollY.current = latest;
  });

  const handleNav = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    setExpanded(false);
    const id = href.replace('#', '');
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Full-width bar ── */}
      <AnimatePresence>
        {phase === 'full' && (
          <motion.nav
            className="fixed top-0 left-0 right-0 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <a
                href="#hero"
                onClick={(e) => handleNav(e, '#hero')}
                className="font-display font-bold text-lg text-white tracking-tight flex items-center gap-1"
              >
                NAOL
                <motion.span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-white"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
              </a>

              <div className="hidden md:flex items-center gap-8">
                {NAV_ITEMS.map((item, i) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNav(e, item.href)}
                    className="font-sans text-[11px] font-medium uppercase tracking-[0.15em] text-text-2 hover:text-white transition-colors duration-300"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </div>

              <button
                className="md:hidden text-text-2 hover:text-white transition-colors"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Dynamic Island ── */}
      <AnimatePresence>
        {phase === 'island' && (
          <motion.div
            className="fixed top-4 left-1/2 z-50"
            initial={{ opacity: 0, y: -30, x: '-50%', scale: 0.8 }}
            animate={{
              opacity: hidden ? 0 : 1,
              y: hidden ? -60 : 0,
              x: '-50%',
              scale: hidden ? 0.8 : 1,
            }}
            exit={{ opacity: 0, y: -30, x: '-50%', scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <motion.div
              className="relative bg-black/70 backdrop-blur-2xl border border-white/[0.08] overflow-hidden"
              animate={{
                borderRadius: expanded ? 24 : 50,
                width: expanded ? 420 : 'auto',
                height: expanded ? 'auto' : 44,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.06)',
              }}
            >
              {/* Collapsed */}
              <div className="flex items-center gap-3 px-5 h-[44px]">
                <a
                  href="#hero"
                  onClick={(e) => handleNav(e, '#hero')}
                  className="font-display font-bold text-sm text-white tracking-tight flex items-center gap-1 shrink-0"
                >
                  NAOL
                  <motion.span
                    className="inline-block w-1 h-1 rounded-full bg-white"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </a>

                <div className="hidden md:flex items-center gap-4 ml-3">
                  {!expanded && NAV_ITEMS.slice(0, 3).map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(e) => handleNav(e, item.href)}
                      className="font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-text-3 hover:text-white transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setMobileOpen(true);
                    } else {
                      setExpanded(!expanded);
                    }
                  }}
                  className="ml-auto text-text-3 hover:text-white transition-colors p-1"
                  aria-label="Toggle navigation"
                >
                  <motion.div
                    animate={{ rotate: expanded ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {expanded ? <X size={14} /> : <Menu size={14} />}
                  </motion.div>
                </button>
              </div>

              {/* Expanded */}
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    className="px-5 pb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="pt-1 border-t border-white/[0.06]">
                      {NAV_ITEMS.map((item, i) => (
                        <motion.a
                          key={item.label}
                          href={item.href}
                          onClick={(e) => handleNav(e, item.href)}
                          className="block py-2.5 font-sans text-xs font-medium text-text-2 hover:text-white transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          {item.label}
                        </motion.a>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile fullscreen ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-6 text-text-2 hover:text-white transition-colors p-2"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            <nav className="flex flex-col items-center gap-6">
              {NAV_ITEMS.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  className="font-display text-3xl font-semibold text-text-2 hover:text-white transition-colors"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>

            <motion.p
              className="absolute bottom-8 font-mono text-[10px] text-text-3/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              naol demisse
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
