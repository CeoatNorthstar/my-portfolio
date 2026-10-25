import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowsInSimple, ArrowsOutSimple, X } from '@phosphor-icons/react';
import { getHome } from '../../lib/api';
import useMediaQuery from '../../hooks/useMediaQuery';
import IconButton from '../ui/IconButton';
import Card from './Card';
import { BlogList, DataList, PaperList } from './Lists';
import DonateForm from './DonateForm';

const VIEWS = ['about', 'contact'];
const PANELS = {
  blog: { title: 'Blog', blurb: 'Notes, ideas and things still taking shape.', List: BlogList },
  papers: { title: 'Papers', blurb: 'Formal work. Abstract up front, the full paper one click away.', List: PaperList },
  data: { title: 'Data', blurb: 'The numbers behind the writing: datasets, results and discoveries.', List: DataList },
  donate: { title: 'Donate', blurb: 'Buy me a coffee, and I will write more papers.', List: DonateForm },
};
const SPRING = { type: 'spring', stiffness: 260, damping: 32, mass: 0.9 };

const viewPath = (view) => (view === 'intro' ? '/' : `/${view}`);

// Blog / Papers alongside the card: scrolls on its own, can be closed or
// expanded to fill the page.
const SplitPanel = ({ kind, onClose, onExpand }) => {
  const { title, blurb, List } = PANELS[kind];
  return (
    <div className="bg-card border border-line rounded-xl shadow-card flex flex-col lg:h-full overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line shrink-0">
        <div className="min-w-0">
          <h2 className="font-serif text-[26px] leading-none tracking-[-0.02em] text-ink">{title}</h2>
          <p className="mt-2 text-[13px] text-ink-2">{blurb}</p>
        </div>
        <div className="flex items-center gap-0.5 -mr-2">
          <IconButton label="Open full page" onClick={onExpand}>
            <ArrowsOutSimple size={16} weight="bold" />
          </IconButton>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} weight="bold" />
          </IconButton>
        </div>
      </header>
      <div className="flex-1 min-h-0 lg:overflow-y-auto scroll-thin px-6 pt-4 pb-2">
        <List />
      </div>
    </div>
  );
};

// The same section taking over the whole page, with a way back home.
const FullPanel = ({ kind, onHome, onCollapse }) => {
  const { title, blurb, List } = PANELS[kind];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.99 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 bg-canvas overflow-y-auto scroll-thin"
    >
      <div className="sticky top-0 z-10 h-14 px-4 sm:px-6 flex items-center justify-between bg-canvas/85 backdrop-blur-md border-b border-line/70">
        <button
          type="button"
          onClick={onHome}
          className="press inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={15} weight="bold" /> Back to home
        </button>
        <IconButton label="Back to split view" onClick={onCollapse}>
          <ArrowsInSimple size={16} weight="bold" />
        </IconButton>
      </div>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-24">
        <h1 className="font-serif text-[44px] sm:text-[52px] leading-none tracking-[-0.03em] text-ink">{title}</h1>
        <p className="mt-4 text-[15px] text-ink-2">{blurb}</p>
        <div className="mt-10">
          <List large />
        </div>
      </div>
    </motion.div>
  );
};

const TITLES = { about: 'About', contact: 'Contact', donate: 'Donate', blog: 'Blog', papers: 'Papers', data: 'Data' };

const Home = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const panelRef = useRef(null);

  const seg = pathname.split('/')[1] || '';
  const panel = PANELS[seg] ? seg : null;
  const full = !!panel && new URLSearchParams(search).has('full');

  const [view, setView] = useState(VIEWS.includes(seg) ? seg : 'intro');
  const [newPaper, setNewPaper] = useState(null);

  // The URL decides the card view, except while a panel is open (the panel
  // owns the URL then and the card keeps whatever it was showing).
  useEffect(() => {
    if (VIEWS.includes(seg)) setView(seg);
    else if (!seg) setView('intro');
  }, [seg]);

  useEffect(() => {
    const key = panel || (view !== 'intro' ? view : null);
    document.title = key ? `${TITLES[key]} — Naol Demisse` : 'Naol Demisse';
  }, [panel, view]);

  useEffect(() => {
    getHome()
      .then((d) => setNewPaper(d.newPaper))
      .catch(() => {});
  }, []);

  // On phones the panel opens below the card; bring it into view.
  useEffect(() => {
    if (panel && !full && !isDesktop && panelRef.current) {
      const t = setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [panel, full, isDesktop]);

  const onNav = useCallback(
    (key) => {
      if (PANELS[key]) {
        navigate(panel === key ? viewPath(view) : `/${key}`);
        return;
      }
      const next = view === key ? 'intro' : key;
      setView(next);
      if (!panel) navigate(viewPath(next));
    },
    [navigate, panel, view]
  );

  const goHome = useCallback(() => {
    setView('intro');
    navigate('/');
  }, [navigate]);

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <main className="relative z-10 min-h-[100svh] flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-6 px-4 py-6 sm:p-6">
        <motion.div layout="position" transition={SPRING} className="w-full sm:w-auto flex justify-center shrink-0">
          <Card
            view={view}
            panel={panel}
            compact={!!panel}
            newPaper={newPaper}
            onNav={onNav}
            onHome={() => (panel ? setView('intro') : goHome())}
          />
        </motion.div>

        <AnimatePresence mode="popLayout" initial={false}>
          {panel && !full && (
            <motion.section
              key="panel"
              initial={{ opacity: 0, x: isDesktop ? 40 : 0, y: isDesktop ? 0 : 16 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: isDesktop ? 40 : 0, y: isDesktop ? 0 : 16 }}
              transition={SPRING}
              className="w-full sm:max-w-[600px] lg:max-w-[720px] lg:flex-1 lg:h-[calc(100svh-48px)]"
            >
              <div ref={panelRef} className="h-full scroll-mt-4">
                <SplitPanel
                  key={panel}
                  kind={panel}
                  onClose={() => navigate(viewPath(view))}
                  onExpand={() => navigate(`/${panel}?full=1`)}
                />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {full && <FullPanel key="full" kind={panel} onHome={goHome} onCollapse={() => navigate(`/${panel}`)} />}
      </AnimatePresence>
    </>
  );
};

export default Home;
