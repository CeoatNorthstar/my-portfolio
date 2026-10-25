import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, BookOpenText, DownloadSimple, Minus, Plus } from '@phosphor-icons/react';
import { getPaper } from '../../lib/api';
import { fileSize, formatDate } from '../../lib/format';
import useMediaQuery from '../../hooks/useMediaQuery';
import TopBar from '../ui/TopBar';
import NotFound from '../NotFound';
import { SeeData } from '../data/DataViewer';

const Reader = lazy(() => import('./Reader'));

const Sources = ({ references }) => {
  const [open, setOpen] = useState(false);
  if (!references?.length) return null;
  return (
    <section className="mt-12 border-y border-line">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="flex items-baseline gap-3">
          <span className="font-serif text-[21px] tracking-[-0.01em] text-ink">Sources</span>
          <span className="label">{references.length}</span>
        </span>
        <span className="text-ink-2 group-hover:text-ink">
          {open ? <Minus size={16} weight="bold" /> : <Plus size={16} weight="bold" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ol className="pb-6 space-y-3">
              {references.map((r, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={i} className="flex gap-3 text-[14px] leading-[1.6]">
                  <span className="font-mono text-[11px] text-ink-3 pt-[3px] w-6 shrink-0 tabular-nums">[{i + 1}]</span>
                  <span className="text-ink min-w-0 break-words">
                    {r.text}
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open source"
                        className="inline-flex items-center ml-1.5 align-[-2px] text-ink-3 hover:text-ink"
                      >
                        <ArrowUpRight size={13} weight="bold" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const PaperPage = () => {
  const { slug } = useParams();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [paper, setPaper] = useState(null);
  const [status, setStatus] = useState('loading');
  const [reader, setReader] = useState('closed'); // closed | half | full

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    setReader('closed');
    window.scrollTo(0, 0);
    getPaper(slug)
      .then((d) => {
        if (!alive) return;
        setPaper(d.paper);
        setStatus('ok');
        document.title = `${d.paper.title} — Naol Demisse`;
      })
      .catch((err) => alive && setStatus(err.status === 404 ? 'missing' : 'error'));
    return () => {
      alive = false;
    };
  }, [slug]);

  // Lock page scroll while the reader covers everything.
  useEffect(() => {
    const covering = reader === 'full' || (reader === 'half' && !isDesktop);
    if (!covering) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [reader, isDesktop]);

  if (status === 'missing') return <NotFound />;

  const split = reader === 'half' && isDesktop;

  return (
    <div
      className="min-h-screen transition-[padding] duration-500 ease-out"
      style={{ paddingRight: split ? '50vw' : 0 }}
    >
      <TopBar backTo="/papers" backLabel="Papers" />

      {status === 'loading' && (
        <div className="max-w-[680px] mx-auto px-5 pt-20 animate-pulse" aria-hidden="true">
          <div className="h-3 w-24 rounded bg-ink/[0.06]" />
          <div className="mt-5 h-9 w-4/5 rounded bg-ink/[0.08]" />
          <div className="mt-3 h-9 w-2/3 rounded bg-ink/[0.08]" />
          <div className="mt-12 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-3.5 w-full rounded bg-ink/[0.05]" />
            ))}
          </div>
        </div>
      )}
      {status === 'error' && (
        <p className="max-w-[680px] mx-auto px-5 pt-24 font-serif italic text-[19px] text-ink-2">
          This paper could not load. Refresh in a moment.
        </p>
      )}

      {status === 'ok' && paper && (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[680px] mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-28"
        >
          <div className="flex items-center gap-3">
            <span className="label">Paper</span>
            {paper.is_new && <span className="badge-new">New</span>}
          </div>
          <h1 className="mt-4 font-serif text-[34px] sm:text-[42px] leading-[1.1] tracking-[-0.025em] text-ink">
            {paper.title}
          </h1>
          <p className="mt-5 text-[14px] text-ink-2">
            <span className="text-ink">{paper.authors}</span>
            <span className="mx-2 text-ink-3">/</span>
            {formatDate(paper.published_at, { month: 'long' })}
            {paper.page_count ? (
              <>
                <span className="mx-2 text-ink-3">/</span>
                {paper.page_count} pages
              </>
            ) : null}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReader(reader === 'closed' ? 'half' : 'closed')}
              className="press inline-flex items-center gap-2 h-10 px-5 rounded-md bg-ink text-canvas text-[14px] hover:bg-ink/85"
            >
              <BookOpenText size={16} weight="bold" />
              {reader === 'closed' ? 'Read' : 'Close reader'}
            </button>
            <a
              href={paper.pdf_url}
              download={paper.pdf_name || `${paper.slug}.pdf`}
              className="press inline-flex items-center gap-2 h-10 px-4 rounded-md border border-line text-[14px] text-ink-2 hover:text-ink hover:border-ink/25"
            >
              <DownloadSimple size={16} weight="bold" />
              PDF
              {paper.pdf_size ? <span className="font-mono text-[11px] text-ink-3">{fileSize(paper.pdf_size)}</span> : null}
            </a>
          </div>
          <SeeData datasets={paper.datasets} className="mt-2" />

          {paper.abstract && (
            <section className="mt-12">
              <h2 className="label">Abstract</h2>
              <p className="mt-3 font-serif text-[18.5px] leading-[1.7] text-ink whitespace-pre-line">{paper.abstract}</p>
            </section>
          )}

          <Sources references={paper.references} />
        </motion.article>
      )}

      <Suspense fallback={null}>
        <AnimatePresence>
          {paper && reader !== 'closed' && (
            <Reader
              key="reader"
              paper={paper}
              expanded={reader === 'full'}
              onToggleExpand={() => setReader((r) => (r === 'full' ? 'half' : 'full'))}
              onClose={() => setReader('closed')}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
};

export default PaperPage;
