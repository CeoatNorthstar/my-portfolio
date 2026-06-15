import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';

const MessagesAdmin = () => {
  const [messages, setMessages] = useState(null);

  useEffect(() => {
    admin.listMessages().then((d) => setMessages(d.messages)).catch(() => setMessages([]));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-white font-semibold mb-6">Messages</h1>
      {messages === null ? (
        <p className="font-mono text-sm text-text-3">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="font-mono text-sm text-text-3">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-white text-sm font-medium">{m.name}</span>
                <span className="font-mono text-[10px] text-text-3">{formatDate(m.created_at)}</span>
              </div>
              <a
                href={`mailto:${m.email}`}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-2 hover:text-white mb-3"
              >
                <Mail size={12} /> {m.email}
              </a>
              <p className="text-text-2 text-sm whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesAdmin;
