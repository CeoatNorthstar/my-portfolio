import { useEffect, useState } from 'react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Empty, PageHeader } from './ui';

const MessagesAdmin = () => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    admin
      .listMessages()
      .then((d) => setItems(d.messages))
      .catch(() => setItems([]));
  }, []);

  return (
    <div>
      <PageHeader title="Messages" />
      {items && items.length === 0 && <Empty>No notes yet.</Empty>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((m) => (
            <li key={m.id} className="py-5">
              <div className="flex items-baseline justify-between gap-4">
                <a href={`mailto:${m.email}`} className="text-[14px] text-ink font-medium link-quiet">
                  {m.name !== 'Anonymous' ? `${m.name} · ` : ''}
                  {m.email}
                </a>
                <span className="font-mono text-[11px] text-ink-3 shrink-0">{formatDate(m.created_at)}</span>
              </div>
              <p className="mt-2 text-[14.5px] leading-[1.6] text-ink whitespace-pre-wrap break-words">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MessagesAdmin;
