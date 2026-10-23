import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getPreview } from '../../lib/api';
import { formatDate } from '../../lib/format';

const INTERNAL = /^\/(blog|papers)\/[a-z0-9-]+\/?$/;
const previews = new Map();

const fetchPreview = (path) => {
  if (!previews.has(path)) {
    previews.set(
      path,
      getPreview(path)
        .then((d) => d.preview)
        .catch(() => null)
    );
  }
  return previews.get(path);
};

const sameSitePath = (a) => {
  try {
    const url = new URL(a.getAttribute('href'), window.location.origin);
    return url.origin === window.location.origin ? url.pathname + url.search + url.hash : null;
  } catch {
    return null;
  }
};

// Wikipedia-style hover card for links to my own posts and papers.
const PreviewCard = ({ data, rect }) => {
  const width = 320;
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
  const below = rect.bottom + 10 + 170 < window.innerHeight;
  const style = below ? { left, top: rect.bottom + 10, width } : { left, bottom: window.innerHeight - rect.top + 10, width };
  return (
    <motion.div
      initial={{ opacity: 0, y: below ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      className="fixed z-[75] pointer-events-none bg-card border border-line rounded-lg shadow-card p-4"
    >
      <p className="label">
        {data.type === 'paper' ? 'Paper' : 'Blog'}
        {data.published_at ? ` · ${formatDate(data.published_at)}` : ''}
      </p>
      <p className="mt-1.5 font-serif text-[18px] leading-tight tracking-[-0.01em] text-ink">{data.title}</p>
      {data.summary && <p className="mt-2 text-[13px] leading-[1.55] text-ink-2 line-clamp-4">{data.summary}</p>}
    </motion.div>
  );
};

/**
 * Renders sanitized post HTML. Links to my own writing navigate in-app and
 * show a preview on hover; outside links open in a new tab.
 */
const ArticleBody = ({ html }) => {
  const ref = useRef(null);
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    root.querySelectorAll('a[href]').forEach((a) => {
      const path = sameSitePath(a);
      if (path && INTERNAL.test(path.split(/[?#]/)[0])) {
        a.classList.add('internal');
        a.removeAttribute('target');
      } else if (!path || path.startsWith('/api/media/')) {
        if (!path) a.classList.add('external');
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });

    let timer;
    let current = null;
    const onClick = (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const path = sameSitePath(a);
      if (path && !a.hasAttribute('download') && !path.startsWith('/api/')) {
        e.preventDefault();
        setHover(null);
        navigate(path);
      }
    };
    const onOver = (e) => {
      const a = e.target.closest('a.internal');
      if (!a || a === current) return;
      current = a;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const data = await fetchPreview(sameSitePath(a).split(/[?#]/)[0]);
        if (data && current === a) setHover({ data, rect: a.getBoundingClientRect() });
      }, 260);
    };
    const onOut = (e) => {
      const a = e.target.closest('a.internal');
      if (!a || a.contains(e.relatedTarget)) return;
      current = null;
      clearTimeout(timer);
      setHover(null);
    };
    const hide = () => {
      current = null;
      setHover(null);
    };

    const canHover = window.matchMedia('(hover: hover)').matches;
    root.addEventListener('click', onClick);
    if (canHover) {
      root.addEventListener('mouseover', onOver);
      root.addEventListener('mouseout', onOut);
      window.addEventListener('scroll', hide, { passive: true });
    }
    return () => {
      clearTimeout(timer);
      root.removeEventListener('click', onClick);
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      window.removeEventListener('scroll', hide);
    };
  }, [html, navigate]);

  return (
    <>
      {/* Server-sanitized HTML authored in the admin editor. */}
      {/* eslint-disable-next-line react/no-danger */}
      <div ref={ref} className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
      {createPortal(
        <AnimatePresence>{hover && <PreviewCard key={hover.data.title} {...hover} />}</AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default ArticleBody;
