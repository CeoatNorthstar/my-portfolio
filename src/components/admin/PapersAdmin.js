import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, UploadSimple } from '@phosphor-icons/react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Button, Empty, PageHeader, Status } from './ui';

const PapersAdmin = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState(null);

  const load = () => admin.listPapers().then((d) => setPapers(d.papers)).catch(() => setPapers([]));
  useEffect(() => {
    load();
  }, []);

  const remove = async (p) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete "${p.title}" and its PDF?`)) return;
    await admin.deletePaper(p.id);
    load();
  };

  return (
    <div>
      <PageHeader title="Papers">
        <Button onClick={() => navigate('/admin/papers/new')}>
          <UploadSimple size={14} weight="bold" /> Upload paper
        </Button>
      </PageHeader>
      <p className="-mt-4 mb-8 text-[13.5px] text-ink-2">
        The newest published paper wears a New label for seven days, then it comes off on its own.
      </p>
      {papers && papers.length === 0 && <Empty>No papers yet. Upload a PDF to start.</Empty>}
      {papers && papers.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {papers.map((p) => (
            <li key={p.id} className="py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <Status status={p.status} />
                  {p.is_new && <span className="badge-new">New</span>}
                  <span className="font-mono text-[11px] text-ink-3">
                    {formatDate(p.published_at || p.updated_at)}
                    {p.page_count ? ` · ${p.page_count} pages` : ''}
                    {` · ${p.references.length} sources`}
                  </span>
                </div>
                <Link to={`/admin/papers/${p.id}`} className="mt-1.5 block font-serif text-[19px] text-ink truncate hover:underline underline-offset-4 decoration-ink/30">
                  {p.title}
                </Link>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.status === 'published' && (
                  <a href={`/papers/${p.slug}`} target="_blank" rel="noreferrer" className="h-8 px-2 inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
                    View <ArrowUpRight size={12} weight="bold" />
                  </a>
                )}
                <Button variant="ghost" className="!h-8 !px-3" onClick={() => navigate(`/admin/papers/${p.id}`)}>
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

export default PapersAdmin;
