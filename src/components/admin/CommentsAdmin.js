import { useEffect, useState, useCallback } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';

const CommentsAdmin = () => {
  const [filter, setFilter] = useState('pending');
  const [comments, setComments] = useState(null);

  const load = useCallback(() => {
    setComments(null);
    admin.listComments(filter).then((d) => setComments(d.comments)).catch(() => setComments([]));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (c) => {
    await admin.setCommentApproved(c.id, !c.approved);
    load();
  };
  const remove = async (c) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this comment?')) return;
    await admin.deleteComment(c.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-white font-semibold">Comments</h1>
        <div className="flex gap-2">
          {['pending', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                filter === f ? 'text-white border-white/20 bg-white/[0.08]' : 'text-text-3 border-white/[0.06]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {comments === null ? (
        <p className="font-mono text-sm text-text-3">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="font-mono text-sm text-text-3">Nothing here.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-white text-sm font-medium">{c.author_name}</span>
                <span className="font-mono text-[10px] text-text-3">{formatDate(c.created_at)}</span>
                <span className="font-mono text-[10px] text-text-3">· on {c.post_title || 'unknown'}</span>
                {c.approved ? (
                  <span className="px-1.5 py-0.5 rounded font-mono text-[9px] uppercase bg-green-400/10 text-green-300">
                    approved
                  </span>
                ) : null}
              </div>
              <p className="text-text-2 text-sm whitespace-pre-wrap mb-3">{c.body}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-text-2 hover:text-white text-xs transition-colors"
                >
                  <Check size={13} /> {c.approved ? 'Unapprove' : 'Approve'}
                </button>
                <button
                  onClick={() => remove(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-text-2 hover:text-red-400 text-xs transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsAdmin;
