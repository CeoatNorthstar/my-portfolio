import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageSquare, Plus, X } from '@phosphor-icons/react';
import Editor from './Editor';
import { admin } from '../../lib/api';
import { Button, Field, Status, input } from './ui';

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({ title: '', excerpt: '', cover_url: '', keywords: '', status: 'draft', slug: '' });
  const [sources, setSources] = useState([]);
  const [body, setBody] = useState({ html: '', json: null });
  const [initialHtml, setInitialHtml] = useState(isEdit ? null : '');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    admin
      .getPost(id)
      .then(({ post: p }) => {
        setForm({
          title: p.title || '',
          excerpt: p.excerpt || '',
          cover_url: p.cover_url || '',
          keywords: p.keywords || '',
          status: p.status,
          slug: p.slug,
        });
        setSources(p.sources || []);
        setBody({ html: p.body_html || '', json: p.body_json || null });
        setInitialHtml(p.body_html || '');
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this post.');
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSource = (i, k, v) => setSources((list) => list.map((s, j) => (j === i ? { ...s, [k]: v } : s)));

  const uploadCover = async (file) => {
    if (!file) return;
    try {
      const r = await admin.upload(file);
      set('cover_url', r.url);
    } catch (err) {
      setError(err.message || 'Cover upload failed');
    }
  };

  const save = useCallback(
    async (status) => {
      setError('');
      if (!form.title.trim()) {
        setError('Give it a title first.');
        return;
      }
      setSaving(true);
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        cover_url: form.cover_url,
        keywords: form.keywords,
        sources: sources.filter((s) => s.title.trim() || s.url.trim()),
        status,
        body_html: body.html,
        body_json: body.json,
      };
      try {
        if (isEdit) await admin.updatePost(id, payload);
        else await admin.createPost(payload);
        navigate('/admin');
      } catch (err) {
        setError(err.message || 'Save failed.');
        setSaving(false);
      }
    },
    [form, sources, body, isEdit, id, navigate]
  );

  if (loading) return <p className="label animate-pulse">Loading</p>;

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink mb-8">
        <ArrowLeft size={14} weight="bold" /> All writing
      </Link>

      <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
        <div className="space-y-4 min-w-0">
          <input
            className="w-full bg-transparent font-serif text-[36px] leading-tight tracking-[-0.02em] text-ink placeholder:text-ink-3 focus:outline-none"
            placeholder="Title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <textarea
            className="w-full bg-transparent font-serif italic text-[19px] leading-[1.5] text-ink-2 placeholder:text-ink-3 resize-none focus:outline-none"
            rows={2}
            placeholder="A one or two line summary (optional, shown under the title and in lists)"
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
          />
          <Editor initialContent={initialHtml} onChange={setBody} postId={id} />

          <section className="pt-6">
            <div className="flex items-center justify-between">
              <span className="label">Sources</span>
              <Button variant="ghost" className="!h-8 !px-3" onClick={() => setSources((s) => [...s, { title: '', url: '' }])}>
                <Plus size={13} weight="bold" /> Add source
              </Button>
            </div>
            {sources.length === 0 && (
              <p className="mt-3 text-[13px] text-ink-3">Anything you leaned on. Listed at the end of the post.</p>
            )}
            <ul className="mt-3 space-y-2">
              {sources.map((s, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-[11px] text-ink-3 w-5 pt-2.5 text-right">{i + 1}</span>
                  <input className={`${input} flex-1`} placeholder="Title" value={s.title} onChange={(e) => setSource(i, 'title', e.target.value)} />
                  <input className={`${input} flex-1`} placeholder="https://" value={s.url} onChange={(e) => setSource(i, 'url', e.target.value)} />
                  <button
                    type="button"
                    aria-label="Remove source"
                    onClick={() => setSources((list) => list.filter((_, j) => j !== i))}
                    className="w-9 shrink-0 inline-flex items-center justify-center text-ink-3 hover:text-warn-fg"
                  >
                    <X size={14} weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          {error && <p className="text-[13px] text-warn-fg">{error}</p>}
          <div className="flex items-center gap-3">
            <Status status={form.status} />
            {form.status === 'published' && form.slug && (
              <a href={`/blog/${form.slug}`} target="_blank" rel="noreferrer" className="text-[12.5px] text-ink-2 link-quiet">
                View live
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => save('published')} disabled={saving}>
              {saving ? 'Saving' : form.status === 'published' ? 'Update' : 'Publish'}
            </Button>
            <Button variant="ghost" onClick={() => save('draft')} disabled={saving}>
              {form.status === 'published' ? 'Unpublish' : 'Save draft'}
            </Button>
          </div>

          <Field
            label="Keywords"
            hint="Terms this post explains, comma separated (e.g. tachyon, tachyons). Future writing can auto-link to it."
          >
            <input className={input} value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="tachyon, tachyons" />
          </Field>

          <div>
            <span className="label">Cover image</span>
            <div className="mt-2">
              {form.cover_url ? (
                <div className="relative rounded-md overflow-hidden border border-line">
                  <img src={form.cover_url} alt="" className="w-full aspect-video object-cover" />
                  <button
                    type="button"
                    aria-label="Remove cover"
                    onClick={() => set('cover_url', '')}
                    className="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-md bg-card/90 text-ink"
                  >
                    <X size={13} weight="bold" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 aspect-video rounded-md border border-dashed border-line text-ink-3 hover:text-ink hover:border-ink/25 cursor-pointer transition-colors">
                  <ImageSquare size={20} weight="bold" />
                  <span className="text-[12px]">Upload a cover (optional)</span>
                  <input type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PostEditor;
