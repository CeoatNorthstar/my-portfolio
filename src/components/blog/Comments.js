import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getClientId, getComments, postComment } from '../../lib/api';
import { anonymousAlias } from '../../lib/alias';
import { timeAgo } from '../../lib/format';

/**
 * Anonymous comments. Nothing loads until the section scrolls into view, and
 * only the newest page comes down; older ones stay archived on the server
 * until someone asks for them.
 */
const Comments = ({ postId, initialCount = 0 }) => {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(initialCount);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [honey, setHoney] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const alias = useMemo(() => anonymousAlias(getClientId()), []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const load = useCallback(
    async (before) => {
      setLoading(true);
      try {
        const d = await getComments(postId, before);
        setItems((prev) => (before ? [...prev, ...d.comments] : d.comments));
        setHasMore(d.hasMore);
        setTotal(d.total);
        setLoaded(true);
      } catch {
        setError('Comments are resting. Try again shortly.');
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError('');
    try {
      const d = await postComment(postId, { body, author_name: name, website: honey });
      if (d.comment) {
        setItems((prev) => [d.comment, ...prev]);
        setTotal((t) => t + 1);
      }
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const archived = Math.max(0, total - items.length);

  return (
    <section ref={sectionRef} id="comments" className="scroll-mt-20">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-[24px] tracking-[-0.015em] text-ink">Comments</h2>
        <span className="label">{total}</span>
      </div>

      <form onSubmit={submit} className="mt-5 rounded-lg border border-line bg-card focus-within:border-ink/25 transition-colors">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Add to the conversation. No account needed."
          className="block w-full bg-transparent resize-none px-4 pt-3.5 pb-2 text-[15px] leading-[1.6] text-ink placeholder:text-ink-3 focus:outline-none"
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={`Posting as ${alias}`}
            aria-label="Name (optional)"
            className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-ink placeholder:text-ink-3 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="press h-8 px-3.5 rounded-md bg-ink text-canvas text-[13px] hover:bg-ink/85 disabled:opacity-40"
          >
            {sending ? 'Posting' : 'Post'}
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-[12.5px] text-warn-fg">{error}</p>}

      <ul className="mt-8 divide-y divide-line">
        <AnimatePresence initial={false}>
          {items.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="py-5"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[13.5px] font-medium text-ink">{c.author_name}</span>
                <span className="font-mono text-[10.5px] text-ink-3">{timeAgo(c.created_at)}</span>
              </div>
              <p className="mt-1.5 text-[15px] leading-[1.65] text-ink whitespace-pre-wrap break-words">{c.body}</p>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {loaded && items.length === 0 && (
        <p className="py-4 font-serif italic text-[17px] text-ink-2">Quiet so far. Say the first thing.</p>
      )}
      {!loaded && loading && <p className="py-4 label">Loading comments</p>}
      {hasMore && (
        <button
          type="button"
          disabled={loading}
          onClick={() => load(items[items.length - 1]?.created_at)}
          className="press mt-2 h-9 px-4 rounded-md border border-line text-[13px] text-ink-2 hover:text-ink hover:border-ink/25 disabled:opacity-50"
        >
          {loading ? 'Opening the archive' : `Show archived comments (${archived})`}
        </button>
      )}
    </section>
  );
};

export default Comments;
