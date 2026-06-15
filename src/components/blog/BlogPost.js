import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bookmark, ArrowLeft, ExternalLink } from 'lucide-react';
import GlassButton from '../ui/GlassButton';
import Comments from './Comments';
import { getPost, toggleLike, toggleFavorite } from '../../lib/api';
import { formatDate, TYPE_LABELS } from '../../lib/format';

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | notfound
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setState('loading');
    getPost(slug)
      .then((d) => {
        if (!active) return;
        setPost(d.post);
        setState('ready');
      })
      .catch((err) => {
        if (!active) return;
        setState(err.status === 404 ? 'notfound' : 'notfound');
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const onLike = useCallback(async () => {
    if (busy || !post) return;
    setBusy(true);
    // optimistic
    setPost((p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }));
    try {
      const r = await toggleLike(post.id);
      setPost((p) => ({ ...p, liked: r.liked, likes: r.likes }));
    } catch {
      /* revert on failure */
      setPost((p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? 1 : -1) }));
    } finally {
      setBusy(false);
    }
  }, [busy, post]);

  const onFavorite = useCallback(async () => {
    if (!post) return;
    setPost((p) => ({ ...p, favorited: !p.favorited }));
    try {
      const r = await toggleFavorite(post.id);
      setPost((p) => ({ ...p, favorited: r.favorited }));
    } catch {
      setPost((p) => ({ ...p, favorited: !p.favorited }));
    }
  }, [post]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen pt-32 section-container">
        <p className="font-mono text-sm text-text-3">Loading…</p>
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="min-h-screen pt-32 section-container text-center">
        <h1 className="text-heading text-white mb-4">404</h1>
        <p className="text-text-2 mb-8">This post doesn't exist or isn't published yet.</p>
        <GlassButton variant="primary" href="/blog" onClick={(e) => { e.preventDefault(); window.location.href = '/blog'; }}>
          Back to Blog
        </GlassButton>
      </div>
    );
  }

  return (
    <article className="min-h-screen pt-24 section-container max-w-3xl">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-3 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={13} /> Blog
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-widest text-text-3">
          <span className="px-2 py-0.5 rounded-md border border-white/[0.1] bg-white/[0.03]">
            {TYPE_LABELS[post.type] || 'Post'}
          </span>
          <span>{formatDate(post.published_at)}</span>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
          {post.title}
        </h1>

        {post.cover_url && (
          <div className="rounded-2xl overflow-hidden border border-white/[0.06] mb-8">
            <img src={post.cover_url} alt={post.title} className="w-full object-cover" />
          </div>
        )}

        {post.type === 'link' && post.link_url && (
          <GlassButton variant="primary" href={post.link_url} target="_blank" rel="noopener noreferrer" className="mb-8">
            Visit Link <ExternalLink size={13} />
          </GlassButton>
        )}

        {/* Rendered (sanitized) body */}
        <div
          className="post-body"
          dangerouslySetInnerHTML={{ __html: post.body_html || '' }}
        />
      </motion.div>

      {/* Like / favorite bar */}
      <div className="flex items-center gap-3 mt-12 pt-6 border-t border-white/[0.06]">
        <button
          onClick={onLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-mono text-xs ${
            post.liked
              ? 'border-red-400/40 bg-red-400/10 text-red-300'
              : 'border-white/[0.08] text-text-2 hover:text-white hover:border-white/[0.18]'
          }`}
        >
          <Heart size={14} fill={post.liked ? 'currentColor' : 'none'} />
          {post.likes}
        </button>
        <button
          onClick={onFavorite}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-mono text-xs ${
            post.favorited
              ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
              : 'border-white/[0.08] text-text-2 hover:text-white hover:border-white/[0.18]'
          }`}
        >
          <Bookmark size={14} fill={post.favorited ? 'currentColor' : 'none'} />
          {post.favorited ? 'Saved' : 'Save'}
        </button>
      </div>

      <Comments postId={post.id} />
    </article>
  );
};

export default BlogPost;
