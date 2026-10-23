import { useEffect, useState } from 'react';
import { admin } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import { Button, Empty, PageHeader } from './ui';

const CommentsAdmin = () => {
  const [items, setItems] = useState(null);

  const load = () => admin.listComments().then((d) => setItems(d.comments)).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  const toggle = async (c) => {
    await admin.setCommentApproved(c.id, !c.approved);
    load();
  };
  const remove = async (c) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this comment for good?')) return;
    await admin.deleteComment(c.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Comments" />
      <p className="-mt-4 mb-8 text-[13.5px] text-ink-2">
        Comments go live right away. Hide anything that should not be there, or delete it.
      </p>
      {items && items.length === 0 && <Empty>No comments yet.</Empty>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((c) => (
            <li key={c.id} className={`py-4 flex gap-4 ${c.approved ? '' : 'opacity-55'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-ink-3">
                  <span className="text-ink font-medium">{c.author_name}</span> on{' '}
                  <a href={`/blog/${c.post_slug}#comments`} target="_blank" rel="noreferrer" className="link-quiet">
                    {c.post_title || 'deleted post'}
                  </a>{' '}
                  <span className="font-mono">{timeAgo(c.created_at)}</span>
                  {!c.approved && <span className="ml-2 font-mono uppercase tracking-wider">hidden</span>}
                </p>
                <p className="mt-1.5 text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{c.body}</p>
              </div>
              <div className="flex items-start gap-1 shrink-0">
                <Button variant="ghost" className="!h-8 !px-3" onClick={() => toggle(c)}>
                  {c.approved ? 'Hide' : 'Show'}
                </Button>
                <Button variant="danger" className="!h-8 !px-3" onClick={() => remove(c)}>
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

export default CommentsAdmin;
