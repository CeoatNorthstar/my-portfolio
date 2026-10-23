import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChatCircle, Heart } from '@phosphor-icons/react';
import { listFavorites, listPapers, listPosts } from '../../lib/api';
import { formatDate } from '../../lib/format';
import Skeleton from '../ui/Skeleton';

// Last result per list, so reopening a panel is instant (refreshed behind it).
const cache = new Map();

const useList = (key, load, pick) => {
  const [state, setState] = useState(() => ({ items: cache.get(key) || null, error: '' }));
  useEffect(() => {
    let alive = true;
    setState({ items: cache.get(key) || null, error: '' });
    load()
      .then((data) => {
        const items = pick(data);
        cache.set(key, items);
        if (alive) setState({ items, error: '' });
      })
      .catch(() => alive && setState((s) => ({ ...s, error: 'Could not load right now.' })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state;
};

const reveal = (i) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay: Math.min(i, 8) * 0.05, ease: [0.16, 1, 0.3, 1] },
});

const Empty = ({ children }) => (
  <div className="py-14 text-center">
    <p className="font-serif italic text-[18px] text-ink-2">{children}</p>
  </div>
);

const Tabs = ({ value, onChange, options }) => (
  <div className="flex items-center gap-5 mb-2">
    {options.map((o) => (
      <button
        key={o.key}
        type="button"
        onClick={() => onChange(o.key)}
        className={`label transition-colors ${value === o.key ? '!text-ink' : 'hover:!text-ink'}`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const BlogList = ({ large = false }) => {
  const [tab, setTab] = useState('all');
  const { items, error } = useList(
    `posts:${tab}`,
    tab === 'saved' ? listFavorites : () => listPosts(),
    (d) => d.posts
  );

  return (
    <div>
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { key: 'all', label: 'All writing' },
          { key: 'saved', label: 'Saved' },
        ]}
      />
      {!items && !error && (
        <div className="pt-6">
          <Skeleton />
        </div>
      )}
      {error && !items && <Empty>{error}</Empty>}
      {items && items.length === 0 && (
        <Empty>
          {tab === 'saved' ? 'Nothing saved yet. Bookmark a post and it waits here.' : 'Nothing here yet. The first post is on its way.'}
        </Empty>
      )}
      {items && items.length > 0 && (
        <ul className="divide-y divide-line">
          {items.map((p, i) => (
            <motion.li key={p.id} {...reveal(i)}>
              <Link to={`/blog/${p.slug}`} className="group block py-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="label">
                    {formatDate(p.published_at)}
                    {p.reading_minutes ? ` · ${p.reading_minutes} min` : ''}
                  </p>
                  <p className="flex items-center gap-3 font-mono text-[11px] text-ink-3">
                    {p.likes > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Heart size={12} weight="bold" /> {p.likes}
                      </span>
                    )}
                    {p.comments > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <ChatCircle size={12} weight="bold" /> {p.comments}
                      </span>
                    )}
                  </p>
                </div>
                <h3
                  className={`mt-2 font-serif tracking-[-0.015em] leading-[1.2] text-ink decoration-ink/30 underline-offset-4 group-hover:underline ${
                    large ? 'text-[26px]' : 'text-[21px]'
                  }`}
                >
                  {p.title}
                </h3>
                {p.excerpt && (
                  <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-2 line-clamp-2">{p.excerpt}</p>
                )}
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const PaperList = ({ large = false }) => {
  const { items, error } = useList('papers', listPapers, (d) => d.papers);

  if (!items && !error) return <Skeleton />;
  if (error && !items) return <Empty>{error}</Empty>;
  if (!items.length) return <Empty>No papers yet. The first one is being typeset.</Empty>;

  return (
    <ul className="divide-y divide-line -mt-6">
      {items.map((p, i) => (
        <motion.li key={p.id} {...reveal(i)}>
          <Link to={`/papers/${p.slug}`} className="group block py-6">
            <div className="flex items-center gap-3">
              <p className="label">{formatDate(p.published_at)}</p>
              {p.is_new && <span className="badge-new">New</span>}
            </div>
            <h3
              className={`mt-2 font-serif tracking-[-0.015em] leading-[1.2] text-ink decoration-ink/30 underline-offset-4 group-hover:underline ${
                large ? 'text-[26px]' : 'text-[21px]'
              }`}
            >
              {p.title}
            </h3>
            <p className="mt-1.5 text-[13px] text-ink-2">{p.authors}</p>
            {p.abstract && (
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-ink-2 line-clamp-3">{p.abstract}</p>
            )}
          </Link>
        </motion.li>
      ))}
    </ul>
  );
};
