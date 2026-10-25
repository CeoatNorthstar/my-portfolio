import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileArrowUp, X } from '@phosphor-icons/react';
import { admin } from '../../lib/api';
import { fileSize } from '../../lib/format';
import { Button, Field, Status, input } from './ui';

const KINDS = [
  { key: 'dataset', label: 'Dataset', hint: 'Raw measurements or simulation output.' },
  { key: 'result', label: 'Result', hint: 'Processed numbers, fits, plots.' },
  { key: 'discovery', label: 'Discovery', hint: 'Something new you found, with the evidence.' },
];

const DataEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({ title: '', kind: 'dataset', summary: '', status: 'draft', slug: '' });
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]); // [{ type, id }]
  const [targets, setTargets] = useState([]); // every post and paper
  const [filter, setFilter] = useState('');
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    Promise.all([admin.listPosts(), admin.listPapers()])
      .then(([p, q]) =>
        setTargets([
          ...q.papers.map((x) => ({ type: 'paper', id: x.id, title: x.title, status: x.status })),
          ...p.posts.map((x) => ({ type: 'post', id: x.id, title: x.title, status: x.status })),
        ])
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    admin
      .getData(id)
      .then(({ dataset: d }) => {
        setForm({ title: d.title, kind: d.kind, summary: d.summary || '', status: d.status, slug: d.slug });
        setFiles(d.files);
        setLinks(d.links.map((l) => ({ type: l.type, id: l.id })));
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this dataset.');
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isLinked = (t) => links.some((l) => l.type === t.type && l.id === t.id);
  const toggleLink = (t) =>
    setLinks((ls) => (isLinked(t) ? ls.filter((l) => !(l.type === t.type && l.id === t.id)) : [...ls, { type: t.type, id: t.id }]));

  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return targets.filter((t) => !q || t.title.toLowerCase().includes(q));
  }, [targets, filter]);

  const addFiles = async (list) => {
    const picked = Array.from(list || []);
    if (!picked.length) return;
    setError('');
    setUploading((n) => n + picked.length);
    await Promise.all(
      picked.map(async (f) => {
        try {
          const r = await admin.upload(f);
          setFiles((fs) => [...fs, { key: r.key, url: r.url, name: f.name, mime: r.mime, size: r.size }]);
        } catch (err) {
          setError(`${f.name}: ${err.message}`);
        } finally {
          setUploading((n) => n - 1);
        }
      })
    );
  };

  const save = async (status) => {
    setError('');
    if (!form.title.trim()) {
      setError('Give it a title first.');
      return;
    }
    setSaving(true);
    const payload = { title: form.title, kind: form.kind, summary: form.summary, status, files, links };
    try {
      if (isEdit) await admin.updateData(id, payload);
      else await admin.createData(payload);
      navigate('/admin/data');
    } catch (err) {
      setError(err.message || 'Save failed.');
      setSaving(false);
    }
  };

  if (loading) return <p className="label animate-pulse">Loading</p>;

  return (
    <div>
      <Link to="/admin/data" className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink mb-8">
        <ArrowLeft size={14} weight="bold" /> All data
      </Link>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          <input
            className="w-full bg-transparent font-serif text-[32px] leading-tight tracking-[-0.02em] text-ink placeholder:text-ink-3 focus:outline-none"
            placeholder="Name this data"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => set('kind', k.key)}
                title={k.hint}
                className={`press h-8 px-3 rounded-md border text-[13px] transition-colors ${
                  form.kind === k.key ? 'border-ink/40 text-ink bg-ink/[0.05]' : 'border-line text-ink-2 hover:text-ink'
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <Field label="What is this?" hint="A few lines: how it was made, units, what each column means.">
            <textarea
              rows={5}
              className={`${input} resize-y leading-[1.6]`}
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
          </Field>

          <div>
            <span className="label">Files</span>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`mt-2 flex flex-col items-center justify-center gap-2 h-32 rounded-md border border-dashed cursor-pointer transition-colors ${
                dragging ? 'border-ink/40 bg-ink/[0.03]' : 'border-line hover:border-ink/25'
              }`}
            >
              <FileArrowUp size={22} weight="bold" className="text-ink-2" />
              <span className="text-[13px] text-ink-2">
                {uploading ? `Uploading ${uploading} file${uploading === 1 ? '' : 's'}` : 'Drop files or click. CSV, JSON, images, PDFs, code, anything.'}
              </span>
              <input type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </label>
            {files.length > 0 && (
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {files.map((f) => (
                  <li key={f.key} className="flex items-center gap-3 py-2">
                    <span className="flex-1 min-w-0 font-mono text-[12.5px] text-ink truncate">{f.name}</span>
                    <span className="font-mono text-[11px] text-ink-3">{fileSize(f.size)}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((fs) => fs.filter((x) => x.key !== f.key))}
                      className="w-8 h-8 inline-flex items-center justify-center text-ink-3 hover:text-warn-fg"
                    >
                      <X size={13} weight="bold" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          {error && <p className="text-[13px] text-warn-fg">{error}</p>}
          <Status status={form.status} />
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => save('published')} disabled={saving || uploading > 0}>
              {saving ? 'Saving' : form.status === 'published' ? 'Update' : 'Publish'}
            </Button>
            <Button variant="ghost" onClick={() => save('draft')} disabled={saving || uploading > 0}>
              {form.status === 'published' ? 'Unpublish' : 'Save draft'}
            </Button>
          </div>

          <div>
            <span className="label">Connected to</span>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-3">
              Ticked posts and papers show a See data button. Only published ones are visible to readers.
            </p>
            <input className={`${input} mt-3 !py-1.5`} placeholder="Filter" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <ul className="mt-2 max-h-[340px] overflow-y-auto scroll-thin space-y-0.5">
              {shown.length === 0 && <li className="py-2 text-[12.5px] text-ink-3">Nothing written yet.</li>}
              {shown.map((t) => (
                <li key={`${t.type}-${t.id}`}>
                  <label className="flex items-start gap-2.5 py-1.5 cursor-pointer">
                    <input type="checkbox" checked={isLinked(t)} onChange={() => toggleLink(t)} className="mt-1 accent-current" />
                    <span className="min-w-0">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3 mr-1.5">{t.type}</span>
                      <span className="text-[13px] text-ink">{t.title}</span>
                      {t.status !== 'published' && <span className="ml-1.5 text-[11px] text-ink-3">(draft)</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DataEditor;
