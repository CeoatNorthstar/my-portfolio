import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowsInSimple, ArrowsOutSimple, Database, DownloadSimple, X } from '@phosphor-icons/react';
import { getData } from '../../lib/api';
import { fileSize, formatDate } from '../../lib/format';
import useMediaQuery from '../../hooks/useMediaQuery';
import IconButton from '../ui/IconButton';
import FilePreview from './FilePreview';

export const KIND_LABELS = { dataset: 'Dataset', result: 'Result', discovery: 'Discovery' };

// Open a dataset in the floating viewer on top of whatever page is showing.
export const useOpenData = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return useCallback(
    (slug) => {
      const params = new URLSearchParams(search);
      params.set('data', slug);
      navigate({ pathname, search: `?${params}` });
    },
    [navigate, pathname, search]
  );
};

const cache = new Map();

const DataViewer = ({ slug, onClose }) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [data, setData] = useState(() => cache.get(slug) || null);
  const [error, setError] = useState('');
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setActive(0);
    setError('');
    setData(cache.get(slug) || null);
    getData(slug)
      .then((d) => {
        cache.set(slug, d.dataset);
        if (alive) setData(d.dataset);
      })
      .catch((err) => alive && setError(err.status === 404 ? 'This data is not public (yet).' : 'Could not load this data.'));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Full-screen on phones: keep the page underneath still.
  useEffect(() => {
    if (isDesktop) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDesktop]);

  const file = data?.files?.[active];
  const frame = !isDesktop
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : expanded
      ? { top: 16, right: 16, bottom: 16, left: 16 }
      : { top: 16, right: 16, bottom: 16, width: 'min(780px, calc(100vw - 32px))' };

  return (
    <motion.section
      layout
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 0.9 }}
      style={frame}
      className="fixed z-[65] flex flex-col bg-card border border-line md:rounded-xl shadow-card overflow-hidden"
      aria-label="Data viewer"
    >
      <header className="shrink-0 px-5 pt-4 pb-4 border-b border-line">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="label flex items-center gap-2">
              <Database size={12} weight="bold" />
              {data ? KIND_LABELS[data.kind] || 'Data' : 'Data'}
              {data?.published_at ? ` · ${formatDate(data.published_at)}` : ''}
              {data?.files ? ` · ${data.files.length} file${data.files.length === 1 ? '' : 's'}` : ''}
            </p>
            <h2 className="mt-1.5 font-serif text-[23px] leading-tight tracking-[-0.015em] text-ink">
              {data?.title || (error ? 'Data' : 'Loading')}
            </h2>
          </div>
          <div className="flex items-center gap-0.5 -mr-2 shrink-0">
            {isDesktop && (
              <IconButton label={expanded ? 'Shrink' : 'Expand'} onClick={() => setExpanded((v) => !v)}>
                {expanded ? <ArrowsInSimple size={16} weight="bold" /> : <ArrowsOutSimple size={16} weight="bold" />}
              </IconButton>
            )}
            <IconButton label="Close data" onClick={onClose}>
              <X size={16} weight="bold" />
            </IconButton>
          </div>
        </div>
        {data?.summary && (
          <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-2 whitespace-pre-line max-h-28 overflow-y-auto scroll-thin">
            {data.summary}
          </p>
        )}
        {data?.links?.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="label">Used in</span>
            {data.links.map((l) => (
              <Link
                key={`${l.type}-${l.id}`}
                to={`/${l.type === 'paper' ? 'papers' : 'blog'}/${l.slug}`}
                className="press inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-line text-[12.5px] text-ink-2 hover:text-ink hover:border-ink/25 max-w-full"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{l.type}</span>
                <span className="truncate">{l.title}</span>
              </Link>
            ))}
          </div>
        )}
      </header>

      {error && <p className="m-auto p-8 font-serif italic text-[18px] text-ink-2">{error}</p>}
      {!error && !data && <p className="m-auto label animate-pulse">Loading</p>}
      {data && data.files.length === 0 && (
        <p className="m-auto p-8 font-serif italic text-[18px] text-ink-2">Files are on their way.</p>
      )}

      {file && (
        <>
          <div className="shrink-0 flex items-center gap-2 px-3 border-b border-line bg-sunk/60">
            <div className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              {data.files.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`press shrink-0 h-7 px-2.5 rounded-md font-mono text-[11.5px] whitespace-nowrap transition-colors ${
                    i === active ? 'bg-card text-ink border border-line' : 'text-ink-2 hover:text-ink border border-transparent'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <a
              href={file.url}
              download={file.name}
              title={`Download ${file.name}`}
              className="press shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] text-ink-2 hover:text-ink hover:bg-ink/[0.06]"
            >
              <DownloadSimple size={13} weight="bold" />
              <span className="font-mono text-[11px]">{fileSize(file.size)}</span>
            </a>
          </div>
          <div className="flex-1 min-h-0">
            <FilePreview key={file.id} file={file} />
          </div>
        </>
      )}
    </motion.section>
  );
};

// Mounted once in App: shows the viewer whenever the URL has ?data=<slug>.
export const DataFloat = () => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const slug = new URLSearchParams(search).get('data');

  const close = useCallback(() => {
    const params = new URLSearchParams(search);
    params.delete('data');
    const rest = params.toString();
    navigate({ pathname, search: rest ? `?${rest}` : '' }, { replace: true });
  }, [navigate, pathname, search]);

  return <AnimatePresence>{slug && <DataViewer key="data" slug={slug} onClose={close} />}</AnimatePresence>;
};

// "See data" for a post or paper with attached datasets.
export const SeeData = ({ datasets, className = '' }) => {
  const open = useOpenData();
  if (!datasets?.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {datasets.map((d) => (
        <button
          key={d.slug}
          type="button"
          onClick={() => open(d.slug)}
          className="press inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-line text-[13px] text-ink hover:border-ink/30 bg-card"
        >
          <Database size={15} weight="bold" />
          {datasets.length === 1 ? 'See data' : d.title}
          <span className="font-mono text-[10.5px] text-ink-3">
            {KIND_LABELS[d.kind] || 'Data'} {'·'} {d.files} file{d.files === 1 ? '' : 's'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default DataViewer;
