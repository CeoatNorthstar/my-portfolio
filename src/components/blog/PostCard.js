import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ExternalLink, FileText, Link2, BookOpen } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import { formatDate, TYPE_LABELS } from '../../lib/format';

const typeIcon = (type) => {
  if (type === 'research') return FileText;
  if (type === 'link') return Link2;
  return BookOpen;
};

const PostCard = ({ post }) => {
  const Icon = typeIcon(post.type);
  const isExternal = post.type === 'link' && post.link_url;

  const inner = (
    <GlassCard className="overflow-hidden group h-full flex flex-col" padding="p-0">
      {/* Cover */}
      <div className="relative aspect-video overflow-hidden bg-elevated flex items-center justify-center">
        {post.cover_url ? (
          <img
            src={post.cover_url}
            alt={post.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            loading="lazy"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(127,127,140,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(127,127,140,0.5) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
              }}
            />
            <Icon size={34} strokeWidth={1.25} className="relative text-text-2/60" />
          </>
        )}
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md border border-white/[0.1] bg-black/40 backdrop-blur-sm font-mono text-[9px] text-text-2 uppercase tracking-wider">
          {TYPE_LABELS[post.type] || 'Post'}
        </span>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="font-mono text-[10px] text-text-3 uppercase tracking-widest mb-2">
          {formatDate(post.published_at)}
        </p>
        <h3 className="font-display text-lg text-white font-semibold mb-2 leading-snug flex items-start gap-1.5">
          {post.title}
          {isExternal && <ExternalLink size={13} className="mt-1 text-text-3 shrink-0" />}
        </h3>
        {post.excerpt && (
          <p className="text-text-2 text-sm leading-relaxed mb-4 line-clamp-3">{post.excerpt}</p>
        )}

        <div className="flex items-center gap-4 mt-auto pt-2 font-mono text-[11px] text-text-3">
          <span className="flex items-center gap-1">
            <Heart size={12} /> {post.likes || 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={12} /> {post.comments || 0}
          </span>
        </div>
      </div>
    </GlassCard>
  );

  if (isExternal) {
    return (
      <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="block h-full">
        {inner}
      </a>
    );
  }
  return (
    <Link to={`/blog/${post.slug}`} className="block h-full">
      {inner}
    </Link>
  );
};

export default PostCard;
