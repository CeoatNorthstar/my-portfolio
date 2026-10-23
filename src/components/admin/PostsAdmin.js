import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus } from '@phosphor-icons/react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Button, Empty, PageHeader, Status } from './ui';

const PostsAdmin = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');

  const load = () =>
    admin
      .listPosts()
      .then((d) => setPosts(d.posts))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const remove = async (p) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${p.title}"? Its comments and likes go with it.`)) return;
    await admin.deletePost(p.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Writing">
        <Button onClick={() => navigate('/admin/new')}>
          <Plus size={14} weight="bold" /> New post
        </Button>
      </PageHeader>
      {error && <p className="text-[13px] text-warn-fg">{error}</p>}
      {posts && posts.length === 0 && <Empty>No posts yet. Write the first one.</Empty>}
      {posts && posts.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {posts.map((p) => (
            <li key={p.id} className="py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Status status={p.status} />
                  <span className="font-mono text-[11px] text-ink-3">
                    {formatDate(p.published_at || p.updated_at)}
                    {p.status === 'published' ? ` · ${p.likes} likes · ${p.comments} comments` : ''}
                  </span>
                </div>
                <Link to={`/admin/edit/${p.id}`} className="mt-1.5 block font-serif text-[19px] text-ink truncate hover:underline underline-offset-4 decoration-ink/30">
                  {p.title}
                </Link>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.status === 'published' && (
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="h-8 px-2 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                    View <ArrowUpRight size={12} weight="bold" />
                  </a>
                )}
                <Button variant="ghost" className="!h-8 !px-3" onClick={() => navigate(`/admin/edit/${p.id}`)}>
                  Edit
                </Button>
                <Button variant="danger" className="!h-8 !px-3" onClick={() => remove(p)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PostsAdmin;
