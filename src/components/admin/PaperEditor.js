import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowClockwise, ArrowLeft, FilePdf, UploadSimple } from '@phosphor-icons/react';
import { admin } from '../../lib/api';
import { extractPaper, referenceUrl } from '../../lib/pdf';
import { fileSize, toDateInput } from '../../lib/format';
import { Button, Field, Status, input } from './ui';

const EMPTY = {
  title: '',
  authors: 'Naol Demisse',
  abstract: '',
  keywords: '',
  references: '',
  published_date: toDateInput(),
  status: 'draft',
  slug: '',
};

const AutoTextarea = ({ value, onChange, minRows = 3, className = '', ...props }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea ref={ref} rows={minRows} value={value} onChange={onChange} className={`${className} resize-none overflow-hidden`} {...props} />
  );
};

/**
 * Upload a PDF and the title, abstract, keywords and sources are read out of
 * it. Everything stays editable before publishing.
 */
const PaperEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const dropRef = useRef(null);

  const [form, setForm] = useState(EMPTY);
  const [pdf, setPdf] = useState(null); // { key, url, name, size, pages }
  const [file, setFile] = useState(null);
  const [knownUrls, setKnownUrls] = useState({});
  const [phase, setPhase] = useState(isEdit ? 'loading' : 'idle'); // loading | idle | reading | ready
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!isEdit) return;
    admin
      .getPaper(id)
      .then(({ paper: p }) => {
        setForm({
          title: p.title,
          authors: p.authors,
          abstract: p.abstract,
          keywords: p.keywords,
          references: p.references.map((r) => r.text).join('\n'),
          published_date: toDateInput(p.published_at || Date.now()),
          status: p.status,
          slug: p.slug,
        });
        setKnownUrls(Object.fromEntries(p.references.filter((r) => r.url).map((r) => [r.text, r.url])));
        setPdf({ key: p.pdf_key, url: p.pdf_url, name: p.pdf_name, size: p.pdf_size, pages: p.page_count });
        setPhase('ready');
      })
      .catch(() => {
        setError('Could not load this paper.');
        setPhase('ready');
      });
  }, [id, isEdit]);

  const fill = useCallback((data, { overwrite }) => {
    setForm((f) => {
      const pickField = (k, v) => (overwrite || !f[k] ? v || f[k] : f[k]);
      return {
        ...f,
        title: pickField('title', data.title),
        abstract: pickField('abstract', data.abstract),
        keywords: pickField('keywords', data.keywords),
        references: pickField('references', data.references.map((r) => r.text).join('\n')),
      };
    });
    setKnownUrls((m) => ({ ...m, ...Object.fromEntries(data.references.filter((r) => r.url).map((r) => [r.text, r.url])) }));
  }, []);

  const readPdf = useCallback(
    async (f, { overwrite }) => {
      setPhase('reading');
      setError('');
      try {
        const data = await extractPaper(await f.arrayBuffer());
        fill(data, { overwrite });
        setPdf((p) => ({ ...(p || {}), pages: data.pageCount }));
        if (!data.title && !data.abstract) setError('The PDF had no readable text layer, so fill the fields in by hand.');
      } catch {
        setError('Could not read text from this PDF. Fill the fields in by hand.');
      }
      setPhase('ready');
    },
    [fill]
  );

  const accept = async (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)) {
      setError('That is not a PDF.');
      return;
    }
    setFile(f);
    setUploading(true);
    const reading = readPdf(f, { overwrite: !isEdit });
    try {
      const r = await admin.upload(f);
      setPdf((p) => ({ ...(p || {}), key: r.key, url: r.url, name: r.filename, size: r.size }));
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
    await reading;
  };

  const save = async (status) => {
    setError('');
    if (!pdf?.key) {
      setError('Upload the PDF first.');
      return;
    }
    if (!form.title.trim()) {
      setError('The paper needs a title.');
      return;
    }
    setSaving(true);
    const references = form.references
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, url: referenceUrl(text) || knownUrls[text] || '' }));
    const payload = {
      title: form.title,
      authors: form.authors,
      abstract: form.abstract,
      keywords: form.keywords,
      references,
      published_date: form.published_date,
      status,
      pdf_key: pdf.key,
      pdf_url: pdf.url,
      pdf_name: pdf.name,
      pdf_size: pdf.size,
      page_count: pdf.pages,
    };
    try {
      if (isEdit) await admin.updatePaper(id, payload);
      else await admin.createPaper(payload);
      navigate('/admin/papers');
    } catch (err) {
      setError(err.message || 'Save failed.');
      setSaving(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0]);
  };

  if (phase === 'loading') return <p className="label animate-pulse">Loading</p>;

  const refCount = form.references.split('\n').filter((l) => l.trim()).length;
  const showForm = isEdit || phase !== 'idle';

  return (
    <div>
      <Link to="/admin/papers" className="inline-flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink mb-8">
        <ArrowLeft size={14} weight="bold" /> All papers
      </Link>

      {!showForm && (
        <label
          ref={dropRef}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex flex-col items-center justify-center gap-3 h-[320px] rounded-lg border border-dashed cursor-pointer transition-colors ${
            dragging ? 'border-ink/40 bg-ink/[0.03]' : 'border-line hover:border-ink/25'
          }`}
        >
          <FilePdf size={28} weight="bold" className="text-ink-2" />
          <span className="font-serif text-[22px] text-ink">Drop the paper here</span>
          <span className="text-[13px] text-ink-2">or click to choose a PDF. Title, abstract and sources are read automatically.</span>
          <input type="file" accept="application/pdf" hidden onChange={(e) => accept(e.target.files[0])} />
        </label>
      )}
      {error && <p className="mt-4 text-[13px] text-warn-fg">{error}</p>}

      {showForm && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div className="space-y-6 min-w-0">
            {phase === 'reading' && <p className="label animate-pulse">Reading the PDF</p>}
            <AutoTextarea
              minRows={1}
              className="w-full bg-transparent font-serif text-[32px] leading-[1.15] tracking-[-0.02em] text-ink placeholder:text-ink-3 focus:outline-none"
              placeholder="Title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Author">
                <input className={input} value={form.authors} onChange={(e) => set('authors', e.target.value)} />
              </Field>
              <Field label="Publication date">
                <input type="date" className={input} value={form.published_date} onChange={(e) => set('published_date', e.target.value)} />
              </Field>
            </div>
            <Field label="Abstract">
              <AutoTextarea
                minRows={6}
                className={`${input} font-serif !text-[16px] leading-[1.65]`}
                value={form.abstract}
                onChange={(e) => set('abstract', e.target.value)}
                placeholder="Pulled from the PDF. Edit freely."
              />
            </Field>
            <Field
              label={`Sources (${refCount})`}
              hint="One source per line, in the paper's order. DOIs, arXiv ids and URLs become links on their own."
            >
              <AutoTextarea
                minRows={6}
                className={`${input} font-mono !text-[12px] leading-[1.7] whitespace-pre`}
                value={form.references}
                onChange={(e) => set('references', e.target.value)}
                placeholder="Extracted references show up here."
              />
            </Field>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <Status status={form.status} />
              {form.status === 'published' && form.slug && (
                <a href={`/papers/${form.slug}`} target="_blank" rel="noreferrer" className="text-[12.5px] text-ink-2 link-quiet">
                  View live
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => save('published')} disabled={saving || uploading || phase === 'reading'}>
                {saving ? 'Saving' : uploading ? 'Uploading' : form.status === 'published' ? 'Update' : 'Publish'}
              </Button>
              <Button variant="ghost" onClick={() => save('draft')} disabled={saving || uploading}>
                {form.status === 'published' ? 'Unpublish' : 'Save draft'}
              </Button>
            </div>

            <div className="rounded-md border border-line bg-card p-4">
              <div className="flex items-start gap-3">
                <FilePdf size={20} weight="bold" className="text-ink-2 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[13px] text-ink truncate">{pdf?.name || file?.name || 'No PDF yet'}</p>
                  <p className="font-mono text-[11px] text-ink-3">
                    {uploading ? 'uploading' : [fileSize(pdf?.size), pdf?.pages && `${pdf.pages} pages`].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="press inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line text-[12.5px] text-ink-2 hover:text-ink hover:border-ink/25 cursor-pointer">
                  <UploadSimple size={13} weight="bold" /> Replace
                  <input type="file" accept="application/pdf" hidden onChange={(e) => accept(e.target.files[0])} />
                </label>
                {file && (
                  <Button variant="ghost" className="!h-8 !px-3 !text-[12.5px]" onClick={() => readPdf(file, { overwrite: true })}>
                    <ArrowClockwise size={13} weight="bold" /> Re-read fields
                  </Button>
                )}
              </div>
            </div>

            <Field label="Keywords" hint="Comma separated. Blog posts can auto-link these terms to this paper.">
              <input className={input} value={form.keywords} onChange={(e) => set('keywords', e.target.value)} />
            </Field>
          </aside>
        </div>
      )}
    </div>
  );
};

export default PaperEditor;
