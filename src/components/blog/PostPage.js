import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookmarkSimple, ChatCircle, Check, Heart, LinkSimple } from '@phosphor-icons/react';
import { getPost, toggleFavorite, toggleLike } from '../../lib/api';
import { formatDate } from '../../lib/format';
import TopBar from '../ui/TopBar';
import NotFound from '../NotFound';
import ArticleBody from './ArticleBody';
import Comments from './Comments';

const Action = ({ active, onClick, label, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    aria-label={label}
    className={`press inline-flex items-center gap-2 h-9 px-3.5 rounded-md border text-[13px] transition-colors ${
      active ? 'border-ink/30 text-ink bg-ink/[0.04]' : 'border-line text-ink-2 hover:text-ink hover:border-ink/25'
    }`}
  >
    {children}
  </button>
);

const ReadingProgress = () => {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-40 h-[2px] pointer-events-none">
      <div className="h-full bg-ink/60 origin-left" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
};

const PostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [status, setStatus] = useState('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    window.scrollTo(0, 0);
    getPost(slug)
      .then((d) => {
        if (!alive) return;
        setPost(d.post);
        setStatus('ok');
        document.title = `${d.post.title} — Naol Demisse`;
      })
      .catch((err) => alive && setStatus(err.status === 404 ? 'missing' : 'error'));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (status === 'missing') return <NotFound />;

  // Hide the summary line when it was auto-made from the opening paragraph.
  const showDek = (() => {
    if (!post?.excerpt) return false;
    const text = new DOMParser().parseFromString(post.body_html || '', 'text/html').body.textContent || '';
    const squash = (s) => s.replace(/\W+/g, '').toLowerCase();
    return !squash(text).startsWith(squash(post.excerpt).slice(0, 80));
  })();

  const like = async () => {
    setPost((p) => ({ ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) }));
    try {
      const d = await toggleLike(post.id);
      setPost((p) => ({ ...p, liked: d.liked, likes: d.likes }));
    } catch {
      /* optimistic state stays */
    }
  };

  const save = async () => {
    setPost((p) => ({ ...p, favorited: !p.favorited }));
    try {
      const d = await toggleFavorite(post.id);
      setPost((p) => ({ ...p, favorited: d.favorited }));
    } catch {
      /* optimistic state stays */
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: post.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="min-h-screen">
      <ReadingProgress />
      <TopBar backTo="/blog" backLabel="Blog" />

      {status === 'loading' && (
        <div className="max-w-[680px] mx-auto px-5 pt-20 animate-pulse" aria-hidden="true">
          <div className="h-3 w-40 rounded bg-ink/[0.06]" />
          <div className="mt-5 h-9 w-4/5 rounded bg-ink/[0.08]" />
          <div className="mt-3 h-9 w-3/5 rounded bg-ink/[0.08]" />
          <div className="mt-10 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-3.5 w-full rounded bg-ink/[0.05]" />
            ))}
          </div>
        </div>
      )}
      {status === 'error' && (
        <p className="max-w-[680px] mx-auto px-5 pt-24 font-serif italic text-[19px] text-ink-2">
          This post could not load. Refresh in a moment.
        </p>
      )}

      {status === 'ok' && post && (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[680px] mx-auto px-5 sm:px-6 pt-14 sm:pt-20 pb-28"
        >
          <header>
            <p className="label">
              {formatDate(post.published_at, { month: 'long' })}
              {post.reading_minutes ? ` · ${post.reading_minutes} min read` : ''}
            </p>
            <h1 className="mt-4 font-serif text-[36px] sm:text-[46px] leading-[1.08] tracking-[-0.025em] text-ink">
              {post.title}
            </h1>
            {showDek && (
              <p className="mt-5 font-serif italic text-[20px] leading-[1.5] text-ink-2">{post.excerpt}</p>
            )}
            <p className="mt-6 text-[13px] text-ink-2">By Naol Demisse</p>
          </header>

          {post.cover_url && (
            <img src={post.cover_url} alt="" className="mt-10 w-full rounded-lg border border-line object-cover" />
          )}

          <div className="mt-10">
            <ArticleBody html={post.body_html || ''} />
          </div>

          {post.sources?.length > 0 && (
            <section className="mt-16 pt-8 border-t border-line">
              <h2 className="label">Sources</h2>
              <ol className="mt-4 space-y-2.5">
                {post.sources.map((s, i) => (
                  <li key={`${s.url}-${i}`} className="flex gap-3 text-[14px] leading-[1.55]">
                    <span className="font-mono text-[11px] text-ink-3 pt-[3px] tabular-nums w-5 shrink-0">{i + 1}</span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="link-quiet text-ink inline">
                        {s.title || s.url}
                        <ArrowUpRight size={11} weight="bold" className="inline ml-1 text-ink-3 -mt-0.5" />
                      </a>
                    ) : (
                      <span className="text-ink">{s.title}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-14 flex flex-wrap items-center gap-2">
            <Action active={post.liked} onClick={like} label="Like">
              <Heart size={15} weight={post.liked ? 'fill' : 'bold'} />
              {post.likes > 0 ? post.likes : 'Like'}
            </Action>
            <Action active={post.favorited} onClick={save} label="Save">
              <BookmarkSimple size={15} weight={post.favorited ? 'fill' : 'bold'} />
              {post.favorited ? 'Saved' : 'Save'}
            </Action>
            <Action onClick={share} label="Share">
              {copied ? <Check size={15} weight="bold" /> : <LinkSimple size={15} weight="bold" />}
              {copied ? 'Copied' : 'Share'}
            </Action>
            <a
              href="#comments"
              className="press ml-auto inline-flex items-center gap-2 h-9 px-2 text-[13px] text-ink-2 hover:text-ink"
            >
              <ChatCircle size={15} weight="bold" /> {post.comments}
            </a>
          </div>

          <div className="mt-16">
            <Comments postId={post.id} initialCount={post.comments} />
          </div>
        </motion.article>
      )}
    </div>
  );
};

export default PostPage;
