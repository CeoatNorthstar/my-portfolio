import { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import PostCard from './PostCard';
import { listPosts } from '../../lib/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'research', label: 'Research' },
  { key: 'article', label: 'Articles' },
  { key: 'link', label: 'Links' },
];

// Full /blog page with search + type filters.
const BlogList = () => {
  const [posts, setPosts] = useState(null);
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback((t, query) => {
    setPosts(null);
    listPosts({ type: t, q: query })
      .then((d) => setPosts(d.posts))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => load(type, q), q ? 300 : 0);
    return () => clearTimeout(id);
  }, [type, q, load]);

  return (
    <div className="min-h-screen pt-24 section-container">
      <ASCIIHeading text="blog" />
      <h1 className="text-heading text-white mb-4">Blog</h1>
      <p className="text-text-2 mb-10 max-w-xl">Research notes and technical writing.</p>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search posts..."
          className="w-full bg-transparent border border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-text-3 focus:border-white/20 focus:outline-none transition-colors font-sans"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-12">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setType(f.key)}
            className={`px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider border transition-all duration-300 ${
              type === f.key
                ? 'text-white border-white/20 bg-white/[0.08]'
                : 'text-text-3 border-white/[0.06] hover:text-text-2 hover:border-white/[0.12]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className="text-center py-16">
          <p className="font-mono text-text-3 text-sm">
            {posts === null ? 'Loading…' : 'No posts found.'}
          </p>
        </GlassCard>
      )}
    </div>
  );
};

export default BlogList;
