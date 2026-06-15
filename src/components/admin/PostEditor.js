import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import Editor from './Editor';
import { admin } from '../../lib/api';

const TYPES = [
  { key: 'article', label: 'Article' },
  { key: 'research', label: 'Research' },
  { key: 'link', label: 'Link' },
];

const field =
  'w-full bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-3 focus:border-white/20 focus:outline-none transition-colors font-sans';

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    type: 'article',
    link_url: '',
    cover_url: '',
    featured: false,
  });
  const [body, setBody] = useState({ html: '', json: null });
  const [initialHtml, setInitialHtml] = useState(isEdit ? null : '');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    admin
      .getPost(id)
      .then((d) => {
        const p = d.post;
        setForm({
          title: p.title || '',
          excerpt: p.excerpt || '',
          type: p.type || 'article',
          link_url: p.link_url || '',
          cover_url: p.cover_url || '',
          featured: !!p.featured,
        });
        setBody({ html: p.body_html || '', json: p.body_json || null });
        setInitialHtml(p.body_html || '');
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load post.');
        setLoading(false);
      });
  }, [id, isEdit]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
        setError('Title is required.');
        return;
      }
      setSaving(true);
      const payload = {
        ...form,
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
    [form, body, isEdit, id, navigate]
  );

  if (loading) return <p className="font-mono text-sm text-text-3">Loading…</p>;

  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-3 hover:text-white mb-6"
      >
        <ArrowLeft size={13} /> Posts
      </Link>

      <div className="grid lg:grid-cols-[1fr_260px] gap-6 items-start">
        {/* Main */}
        <div className="space-y-4 order-2 lg:order-1">
          <input
            className={`${field} text-lg`}
            placeholder="Post title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
          <textarea
            className={`${field} resize-none`}
            rows={2}
            placeholder="Short excerpt (shown on cards)"
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
          />
          {form.type === 'link' && (
            <input
              className={field}
              placeholder="External link URL (https://…)"
              value={form.link_url}
              onChange={(e) => set('link_url', e.target.value)}
            />
          )}
          <Editor initialContent={initialHtml} onChange={setBody} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5 order-1 lg:order-2">
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white text-black font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Publish'}
            </button>
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-text-2 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              Draft
            </button>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-3 mb-2">Type</p>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => set('type', t.key)}
                  className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider border transition-colors ${
                    form.type === t.key
                      ? 'text-white border-white/20 bg-white/[0.08]'
                      : 'text-text-3 border-white/[0.06] hover:text-text-2'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-3 mb-2">Cover</p>
            {form.cover_url ? (
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                <img src={form.cover_url} alt="cover" className="w-full aspect-video object-cover" />
                <button
                  onClick={() => set('cover_url', '')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 aspect-video rounded-xl border border-dashed border-white/[0.12] text-text-3 hover:text-white hover:border-white/[0.2] cursor-pointer transition-colors">
                <ImagePlus size={20} />
                <span className="font-mono text-[10px] uppercase tracking-wider">Upload cover</span>
                <input type="file" accept="image/*" hidden onChange={(e) => uploadCover(e.target.files[0])} />
              </label>
            )}
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set('featured', e.target.checked)}
              className="accent-white w-4 h-4"
            />
            <span className="text-sm text-text-2">Featured</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;
