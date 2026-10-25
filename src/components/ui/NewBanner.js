import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, X } from '@phosphor-icons/react';
import { getHome } from '../../lib/api';
import { store } from '../../lib/storage';
import { KIND_LABELS, useOpenData } from '../data/DataViewer';

const SEEN_KEY = 'banner-seen';

const keyOf = (item) => `${item.type}:${item.slug}`;
const pathOf = (item) => (item.type === 'paper' ? `/papers/${item.slug}` : `/blog/${item.slug}`);
const labelOf = (item) =>
  item.type === 'data' ? `New ${(KIND_LABELS[item.kind] || 'data').toLowerCase()}` : `New ${item.type}`;

/**
 * Small pill at the top of the page when something was published in the last
 * week. Clicking it opens the thing; clicking it or closing it hides the pill
 * until something newer comes out.
 */
const NewBanner = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const openData = useOpenData();
  const [item, setItem] = useState(null);
  const [seen, setSeen] = useState(() => store.get(SEEN_KEY));

  useEffect(() => {
    getHome()
      .then((d) => setItem(d.latest))
      .catch(() => {});
  }, []);

  const markSeen = () => {
    store.set(SEEN_KEY, keyOf(item));
    setSeen(keyOf(item));
  };

  // Already looking at it: that counts as seen.
  const viewing =
    !!item &&
    (item.type === 'data' ? new URLSearchParams(search).get('data') === item.slug : pathname === pathOf(item));
  useEffect(() => {
    if (viewing) markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  const show = !!item && seen !== keyOf(item) && !viewing;

  const open = () => {
    markSeen();
    if (item.type === 'data') openData(item.slug);
    else navigate(pathOf(item));
  };

  return (
    // Below lg it sits under the page header so it never covers the back link.
    <div className="fixed top-[68px] lg:top-3 inset-x-0 z-[35] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {show && (
          <motion.div
            key={keyOf(item)}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            className="pointer-events-auto flex items-center max-w-full h-8 rounded-full border border-line bg-card/90 backdrop-blur-md text-[12.5px]"
          >
            <button type="button" onClick={open} className="group flex items-center gap-2.5 min-w-0 h-full pl-3 pr-2">
              <span className="w-1.5 h-1.5 rounded-full bg-new-fg shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2 shrink-0">{labelOf(item)}</span>
              <span className="text-ink truncate max-w-[52vw] sm:max-w-[380px]">{item.title}</span>
              <ArrowRight size={13} weight="bold" className="text-ink-2 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={markSeen}
              aria-label="Dismiss"
              className="h-full pl-1.5 pr-2.5 text-ink-3 hover:text-ink shrink-0"
            >
              <X size={12} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewBanner;
