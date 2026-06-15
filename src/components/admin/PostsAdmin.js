import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { admin } from '../../lib/api';
import { formatDate, TYPE_LABELS } from '../../lib/format';

const PostsAdmin = () => {
  const [posts, setPosts] = useState(null);

  const load = () => admin.listPosts().then((d) => setPosts(d.posts)).catch(() => setPosts([]));
  useEffect(() => {
    load();
  }, []);

  const remove = async (id, title) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await admin.deletePost(id);
    load();
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-white font-semibold mb-6">Posts</h1>
      {posts === null ? (
        <p className="font-mono text-sm text-text-3">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="font-mono text-sm text-text-3">
          No posts yet. <Link to="/admin/new" className="text-white underline">Write your first.</Link>
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium truncate">{p.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider ${
                      p.status === 'published'
                        ? 'bg-green-400/10 text-green-300'
                        : 'bg-white/[0.06] text-text-3'
                    }`}
                  >
                    {p.status}
                  </span>
                  {p.featured ? (
                    <span className="px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider bg-amber-400/10 text-amber-300">
                      Featured
                    </span>
                  ) : null}
                </div>
                <p className="font-mono text-[10px] text-text-3 mt-0.5">
                  {TYPE_LABELS[p.type] || p.type} · {formatDate(p.updated_at)}
                </p>
              </div>
              {p.status === 'published' && (
                <a
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-3 hover:text-white p-2"
                  title="View"
                >
                  <ExternalLink size={15} />
                </a>
              )}
              <Link to={`/admin/edit/${p.id}`} className="text-text-3 hover:text-white p-2" title="Edit">
                <Pencil size={15} />
              </Link>
              <button onClick={() => remove(p.id, p.title)} className="text-text-3 hover:text-red-400 p-2" title="Delete">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostsAdmin;
