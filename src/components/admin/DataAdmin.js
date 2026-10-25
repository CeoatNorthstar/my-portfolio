import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Plus } from '@phosphor-icons/react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { KIND_LABELS } from '../data/DataViewer';
import { Button, Empty, PageHeader, Status } from './ui';

const DataAdmin = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);

  const load = () => admin.listData().then((d) => setItems(d.datasets)).catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);

  const remove = async (d) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${d.title}" and all its files?`)) return;
    await admin.deleteData(d.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Data">
        <Button onClick={() => navigate('/admin/data/new')}>
          <Plus size={14} weight="bold" /> New dataset
        </Button>
      </PageHeader>
      <p className="-mt-4 mb-8 text-[13.5px] text-ink-2">
        Datasets, results and discoveries. Attach one to a post or paper and readers get a See data button that opens it
        right on the page.
      </p>
      {items && items.length === 0 && <Empty>No data yet.</Empty>}
      {items && items.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {items.map((d) => (
            <li key={d.id} className="py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Status status={d.status} />
                  <span className="font-mono text-[11px] text-ink-3">
                    {KIND_LABELS[d.kind]} {'·'} {formatDate(d.published_at || d.updated_at)} {'·'} {d.files} files{' '}
                    {'·'} {d.links} links
                  </span>
                </div>
                <Link to={`/admin/data/${d.id}`} className="mt-1.5 block font-serif text-[19px] text-ink truncate hover:underline underline-offset-4 decoration-ink/30">
                  {d.title}
                </Link>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {d.status === 'published' && (
                  <a href={`/data?data=${d.slug}`} target="_blank" rel="noreferrer" className="h-8 px-2 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                    View <ArrowUpRight size={12} weight="bold" />
                  </a>
                )}
                <Button variant="ghost" className="!h-8 !px-3" onClick={() => navigate(`/admin/data/${d.id}`)}>
                  Edit
                </Button>
                <Button variant="danger" className="!h-8 !px-3" onClick={() => remove(d)}>
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

export default DataAdmin;
