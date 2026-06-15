import { useEffect, useState, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import GlassButton from '../ui/GlassButton';
import Turnstile from '../ui/Turnstile';
import { getComments, postComment } from '../../lib/api';
import { formatDate } from '../../lib/format';

const Comments = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const load = useCallback(() => {
    getComments(postId)
      .then((d) => setComments(d.comments || []))
      .catch(() => {});
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !body.trim()) return;
    if (!token) {
      setError('Please complete the verification.');
      return;
    }
    setStatus('sending');
    try {
      await postComment(postId, { author_name: name, body, turnstileToken: token });
      setStatus('done');
      setName('');
      setBody('');
      setToken('');
    } catch (err) {
      setError(err.message || 'Failed to submit.');
      setStatus('error');
    }
  };

  const inputClasses =
    'w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-3 focus:border-white/20 focus:outline-none transition-colors font-sans';

  return (
    <section className="mt-16 max-w-2xl">
      <h2 className="flex items-center gap-2 font-display text-xl text-white font-semibold mb-6">
        <MessageCircle size={18} /> Comments
      </h2>

      {/* Existing comments */}
      <div className="space-y-4 mb-10">
        {comments.length === 0 && (
          <p className="font-mono text-xs text-text-3">Be the first to comment.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="border-l-2 border-white/[0.08] pl-4">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm text-white font-medium">{c.author_name}</span>
              <span className="font-mono text-[10px] text-text-3">{formatDate(c.created_at)}</span>
            </div>
            <p className="text-text-2 text-sm whitespace-pre-wrap leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {status === 'done' ? (
        <div className="rounded-xl border border-green-400/20 bg-green-400/[0.05] px-4 py-5 text-center">
          <p className="font-mono text-sm text-green-400">
            Thanks! Your comment is awaiting approval.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className={inputClasses}
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            required
            className={`${inputClasses} resize-none`}
          />
          <Turnstile onToken={setToken} />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <GlassButton type="submit" variant="primary" disabled={status === 'sending'}>
            {status === 'sending' ? 'Posting…' : 'Post Comment'}
          </GlassButton>
        </form>
      )}
    </section>
  );
};

export default Comments;
