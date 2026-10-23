import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  Highlighter,
  ListBullets,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  MoonStars,
  Trash,
  X,
} from '@phosphor-icons/react';
import { loadPdfjs, openPdf } from '../../lib/pdf';
import { store } from '../../lib/storage';
import useMediaQuery from '../../hooks/useMediaQuery';
import IconButton from '../ui/IconButton';

const COLORS = ['yellow', 'green', 'blue', 'pink'];
const PAGE_GAP = 20;

// Opened documents stay cached so closing and reopening the reader is instant.
const docs = new Map();
const getDoc = (url) => {
  if (!docs.has(url)) {
    docs.set(
      url,
      openPdf(url).catch((err) => {
        docs.delete(url);
        throw err;
      })
    );
  }
  return docs.get(url);
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Merge selection rects that sit on the same line and touch or overlap.
const mergeRects = (rects) => {
  const sorted = [...rects].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(last[1] - r[1]) < last[3] * 0.5 && r[0] <= last[0] + last[2] + 0.006) {
      const right = Math.max(last[0] + last[2], r[0] + r[2]);
      const bottom = Math.max(last[1] + last[3], r[1] + r[3]);
      last[1] = Math.min(last[1], r[1]);
      last[2] = right - last[0];
      last[3] = bottom - last[1];
    } else {
      out.push([...r]);
    }
  }
  return out.map((r) => r.map((v) => Math.round(v * 10000) / 10000));
};

const PdfPage = ({ doc, num, size, scale, root, highlights }) => {
  const pageRef = useRef(null);
  const canvasHolder = useRef(null);
  const textHolder = useRef(null);
  const [near, setNear] = useState(num <= 2);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = pageRef.current;
    if (!el || !root) return undefined;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root,
      rootMargin: '1200px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    if (!near) {
      // Far away: free the canvas memory.
      canvasHolder.current?.replaceChildren();
      textHolder.current?.replaceChildren();
      setDrawn(false);
      return undefined;
    }
    let cancelled = false;
    let task = null;
    let textLayer = null;
    const timer = setTimeout(async () => {
      try {
        const page = await doc.getPage(num);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        task = page.render({
          canvas,
          canvasContext: canvas.getContext('2d'),
          viewport,
          transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
        });
        await task.promise;
        if (cancelled) return;
        canvasHolder.current.replaceChildren(canvas);
        setDrawn(true);

        const lib = await loadPdfjs();
        const textDiv = document.createElement('div');
        textDiv.className = 'textLayer';
        textLayer = new lib.TextLayer({ textContentSource: page.streamTextContent(), container: textDiv, viewport });
        await textLayer.render();
        if (cancelled) return;
        const end = document.createElement('div');
        end.className = 'endOfContent';
        textDiv.append(end);
        textHolder.current.replaceChildren(textDiv);
      } catch {
        /* cancelled renders throw; nothing to do */
      }
    }, 40);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      task?.cancel();
      textLayer?.cancel();
    };
  }, [near, scale, doc, num]);

  return (
    <div
      ref={pageRef}
      data-page={num}
      className="pdf-page"
      style={{ width: size.w * scale, height: size.h * scale, '--total-scale-factor': scale }}
    >
      <div ref={canvasHolder} className="absolute inset-0" />
      {!drawn && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-[#A5A39E]">{num}</span>
      )}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {highlights.map((h) =>
          h.rects.map((r, i) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={`${h.id}-${i}`}
              className={`pdf-hl hl-${h.color}`}
              style={{ left: `${r[0] * 100}%`, top: `${r[1] * 100}%`, width: `${r[2] * 100}%`, height: `${r[3] * 100}%` }}
            />
          ))
        )}
      </div>
      <div ref={textHolder} />
    </div>
  );
};

const HighlightList = ({ items, onJump, onRemove, onClear, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.18 }}
    className="absolute right-3 top-[52px] z-20 w-[300px] max-h-[60vh] overflow-y-auto scroll-thin bg-card border border-line rounded-lg shadow-card"
  >
    <div className="flex items-center justify-between px-4 h-11 border-b border-line">
      <span className="label">Highlights</span>
      <div className="flex items-center gap-2">
        {items.length > 0 && (
          <button type="button" onClick={onClear} className="text-[12px] text-ink-2 hover:text-warn-fg">
            Clear all
          </button>
        )}
        <IconButton label="Close list" onClick={onClose} className="!w-7 !h-7">
          <X size={13} weight="bold" />
        </IconButton>
      </div>
    </div>
    {items.length === 0 ? (
      <p className="px-4 py-5 text-[13px] leading-[1.55] text-ink-2">
        Turn on the highlighter, then select text on the page. Highlights stay in this browser.
      </p>
    ) : (
      <ul className="divide-y divide-line">
        {[...items]
          .sort((a, b) => a.page - b.page)
          .map((h) => (
            <li key={h.id} className="group flex gap-3 px-4 py-3">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 hl-${h.color}`} />
              <button type="button" onClick={() => onJump(h.page)} className="flex-1 min-w-0 text-left">
                <span className="font-mono text-[10.5px] text-ink-3">p. {h.page}</span>
                <span className="block text-[13px] leading-[1.45] text-ink line-clamp-2">{h.text || 'Highlight'}</span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(h.id)}
                aria-label="Remove highlight"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-ink-3 hover:text-warn-fg transition-opacity"
              >
                <Trash size={14} weight="bold" />
              </button>
            </li>
          ))}
      </ul>
    )}
  </motion.div>
);

/**
 * In-page PDF reader. Slides in from the right at half width; expand to make
 * the whole page the paper. Highlights are kept per paper in localStorage.
 */
const Reader = ({ paper, expanded, onToggleExpand, onClose }) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const scrollRef = useRef(null);
  const ratioRef = useRef(0);
  const [root, setRoot] = useState(null);
  const [doc, setDoc] = useState(null);
  const [sizes, setSizes] = useState([]);
  const [error, setError] = useState('');
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [marking, setMarking] = useState(false);
  const [color, setColor] = useState('yellow');
  const [night, setNight] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [listOpen, setListOpen] = useState(false);

  const storageKey = `hl:${paper.id}`;
  const [highlights, setHighlights] = useState(() => store.getJson(storageKey, []));
  useEffect(() => store.setJson(storageKey, highlights), [storageKey, highlights]);

  useEffect(() => {
    let alive = true;
    getDoc(paper.pdf_url)
      .then(async (d) => {
        const pages = await Promise.all(
          Array.from({ length: d.numPages }, (_, i) =>
            d.getPage(i + 1).then((p) => {
              const v = p.getViewport({ scale: 1 });
              return { w: v.width, h: v.height };
            })
          )
        );
        if (alive) {
          setDoc(d);
          setSizes(pages);
        }
      })
      .catch(() => alive && setError('This PDF could not be opened here. You can still download it.'));
    return () => {
      alive = false;
    };
  }, [paper.pdf_url]);

  // Track the available width (debounced so the expand animation doesn't re-render every frame).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    setRoot(el);
    let t;
    const ro = new ResizeObserver(([entry]) => {
      clearTimeout(t);
      const w = entry.contentRect.width;
      t = setTimeout(() => setWidth(w), 140);
    });
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  const maxW = sizes.reduce((m, s) => Math.max(m, s.w), 0);
  const fit = maxW && width ? (width - (isDesktop ? 64 : 24)) / maxW : 1;
  const scale = Math.round(Math.min(5, Math.max(0.25, fit * zoom)) * 1000) / 1000;

  // Keep the reading position when the scale changes.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = ratioRef.current * el.scrollHeight;
  }, [scale]);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    ratioRef.current = el.scrollTop / Math.max(1, el.scrollHeight);
    const probe = el.scrollTop + el.clientHeight * 0.35;
    let n = 1;
    for (const child of el.querySelectorAll('[data-page]')) {
      if (child.offsetTop <= probe) n = Number(child.dataset.page);
      else break;
    }
    setPage(n);
    setPageInput(String(n));
  }, []);

  const goTo = useCallback((n) => {
    const el = scrollRef.current;
    const target = el?.querySelector(`[data-page="${n}"]`);
    if (target) el.scrollTo({ top: target.offsetTop - 16, behavior: 'smooth' });
  }, []);

  // Escape: collapse first, then close.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (listOpen) setListOpen(false);
      else if (expanded) onToggleExpand();
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, listOpen, onClose, onToggleExpand]);

  const capture = useCallback(() => {
    if (!marking) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!scrollRef.current.contains(range.commonAncestorContainer)) return;

    const pages = [...scrollRef.current.querySelectorAll('[data-page]')];
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
    const heights = rects.map((r) => r.height).sort((a, b) => a - b);
    const median = heights[Math.floor(heights.length / 2)] || 0;
    const byPage = new Map();
    for (const r of rects) {
      if (r.height > median * 2.2) continue; // whole-block rects, not text
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const el = pages.find((p) => {
        const b = p.getBoundingClientRect();
        return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
      });
      if (!el) continue;
      const b = el.getBoundingClientRect();
      const n = Number(el.dataset.page);
      if (!byPage.has(n)) byPage.set(n, []);
      byPage.get(n).push([(r.left - b.left) / b.width, (r.top - b.top) / b.height, r.width / b.width, r.height / b.height]);
    }
    const text = sel.toString().replace(/\s+/g, ' ').trim().slice(0, 280);
    sel.removeAllRanges();
    if (!byPage.size) return;
    const created = [...byPage].map(([n, rs]) => ({ id: uid(), page: n, color, text, rects: mergeRects(rs) }));
    setHighlights((h) => [...h, ...created]);
  }, [marking, color]);

  // While highlighting, clicking an existing highlight removes it.
  const onClickPage = useCallback(
    (e) => {
      if (!marking) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) return;
      const el = e.target.closest('[data-page]');
      if (!el) return;
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width;
      const y = (e.clientY - b.top) / b.height;
      const n = Number(el.dataset.page);
      const hit = highlights.find(
        (h) => h.page === n && h.rects.some((r) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3])
      );
      if (hit) setHighlights((hs) => hs.filter((h) => h.id !== hit.id));
    },
    [marking, highlights]
  );

  const drawerWidth = expanded || !isDesktop ? '100vw' : '50vw';
  const pageCount = sizes.length;

  return (
    <motion.aside
      initial={{ x: '100%' }}
      animate={{ x: 0, width: drawerWidth }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 220, damping: 32, mass: 0.9 }}
      style={{ width: drawerWidth }}
      className="fixed top-0 right-0 bottom-0 z-40 flex flex-col bg-sunk border-l border-line"
      aria-label={`Reading ${paper.title}`}
    >
      <div className="relative h-[52px] shrink-0 flex items-center gap-1 px-2 sm:px-3 border-b border-line bg-card/90 backdrop-blur-md overflow-x-auto scroll-thin">
        {expanded && isDesktop && (
          <p className="hidden xl:block max-w-[28ch] truncate font-serif text-[15px] text-ink mr-3 pl-2">{paper.title}</p>
        )}

        <div className="flex items-center">
          <IconButton label="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, z / 1.15))}>
            <MagnifyingGlassMinus size={16} weight="bold" />
          </IconButton>
          <button
            type="button"
            onClick={() => setZoom(1)}
            title="Fit width"
            className="w-12 text-center font-mono text-[11px] text-ink-2 hover:text-ink tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconButton label="Zoom in" onClick={() => setZoom((z) => Math.min(4, z * 1.15))}>
            <MagnifyingGlassPlus size={16} weight="bold" />
          </IconButton>
        </div>

        <span className="w-px h-5 bg-line mx-1 shrink-0" />

        <div className="flex items-center">
          <IconButton label="Previous page" onClick={() => goTo(Math.max(1, page - 1))} disabled={page <= 1}>
            <CaretLeft size={15} weight="bold" />
          </IconButton>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Math.min(pageCount, Math.max(1, parseInt(pageInput, 10) || 1));
              goTo(n);
            }}
            className="flex items-center gap-1 font-mono text-[11px] text-ink-2"
          >
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ''))}
              aria-label="Page"
              className="w-8 h-7 text-center bg-transparent border border-line rounded text-ink focus:outline-none focus:border-ink/30 tabular-nums"
            />
            <span className="tabular-nums">/ {pageCount || '-'}</span>
          </form>
          <IconButton label="Next page" onClick={() => goTo(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
            <CaretRight size={15} weight="bold" />
          </IconButton>
        </div>

        <span className="w-px h-5 bg-line mx-1 shrink-0" />

        <div className="flex items-center gap-1">
          <IconButton label={marking ? 'Stop highlighting' : 'Highlight'} active={marking} onClick={() => setMarking((m) => !m)}>
            <Highlighter size={16} weight={marking ? 'fill' : 'bold'} />
          </IconButton>
          <AnimatePresence initial={false}>
            {marking && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1.5 overflow-hidden p-1"
              >
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`${c} highlighter`}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full hl-${c} ring-offset-2 ring-offset-card transition-shadow ${
                      color === c ? 'ring-1 ring-ink/60' : ''
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <IconButton label="Highlights" active={listOpen} onClick={() => setListOpen((o) => !o)}>
            <span className="relative">
              <ListBullets size={16} weight="bold" />
              {highlights.length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-ink text-canvas font-mono text-[8.5px] leading-[14px] text-center">
                  {highlights.length}
                </span>
              )}
            </span>
          </IconButton>
          <IconButton label={night ? 'Paper colors' : 'Night reading'} active={night} onClick={() => setNight((n) => !n)}>
            <MoonStars size={16} weight={night ? 'fill' : 'bold'} />
          </IconButton>
        </div>

        <div className="ml-auto flex items-center gap-0.5 pl-2">
          <a
            href={paper.pdf_url}
            download={paper.pdf_name || `${paper.slug}.pdf`}
            aria-label="Download PDF"
            title="Download PDF"
            className="press inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-2 hover:text-ink hover:bg-ink/[0.06]"
          >
            <DownloadSimple size={16} weight="bold" />
          </a>
          {isDesktop && (
            <IconButton label={expanded ? 'Back to half page' : 'Fill the page'} onClick={onToggleExpand}>
              {expanded ? <ArrowsInSimple size={16} weight="bold" /> : <ArrowsOutSimple size={16} weight="bold" />}
            </IconButton>
          )}
          <IconButton label="Close reader" onClick={onClose}>
            <X size={16} weight="bold" />
          </IconButton>
        </div>
      </div>

      <AnimatePresence>
        {listOpen && (
          <HighlightList
            items={highlights}
            onJump={(n) => goTo(n)}
            onRemove={(id) => setHighlights((hs) => hs.filter((h) => h.id !== id))}
            onClear={() => setHighlights([])}
            onClose={() => setListOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        onMouseUp={capture}
        onTouchEnd={capture}
        onClick={onClickPage}
        className={`flex-1 min-h-0 overflow-auto scroll-thin ${marking ? 'is-highlighting' : ''} ${night ? 'pdf-night' : ''}`}
      >
        {error && (
          <div className="h-full flex items-center justify-center p-8 text-center">
            <p className="font-serif italic text-[18px] text-ink-2 max-w-[32ch]">{error}</p>
          </div>
        )}
        {!error && !doc && (
          <div className="h-full flex items-center justify-center">
            <p className="label animate-pulse">Opening the paper</p>
          </div>
        )}
        {doc && width > 0 && (
          <div className="py-6 sm:py-8 flex flex-col items-center" style={{ gap: PAGE_GAP, minWidth: 'min-content' }}>
            {sizes.map((size, i) => (
              <PdfPage
                key={i + 1}
                doc={doc}
                num={i + 1}
                size={size}
                scale={scale}
                root={root}
                highlights={highlights.filter((h) => h.page === i + 1)}
              />
            ))}
          </div>
        )}
      </div>
    </motion.aside>
  );
};

export default Reader;
