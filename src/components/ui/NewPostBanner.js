import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, X, ArrowRight } from 'lucide-react';
import { getLatestPost } from '../../lib/api';

const SEEN_KEY = 'sc_last_seen_post';

/**
 * Dismissible "new post" banner. Shows when the latest published post is
 * newer than what this visitor has already seen (tracked in localStorage).
 */
const NewPostBanner = () => {
  const [post, setPost] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getLatestPost()
      .then((d) => {
        const latest = d.latest;
        if (!latest || !latest.published_at) return;
        const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
        if (latest.published_at > seen) {
          setPost(latest);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    if (post) localStorage.setItem(SEEN_KEY, String(post.published_at));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && post && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-xl"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.12] bg-black/70 backdrop-blur-2xl px-4 py-3 shadow-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.06] shrink-0">
              <Sparkles size={15} className="text-amber-300" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-3">New post</p>
              <p className="text-sm text-white font-medium truncate">{post.title}</p>
            </div>
            <Link
              to={`/blog/${post.slug}`}
              onClick={dismiss}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] font-mono text-[10px] uppercase tracking-wider text-white transition-colors shrink-0"
            >
              Read <ArrowRight size={11} />
            </Link>
            <button
              onClick={dismiss}
              aria-label="Dismiss"
              className="text-text-3 hover:text-white transition-colors p-1 shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NewPostBanner;
