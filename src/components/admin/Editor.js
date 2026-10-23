import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extensions';
import {
  Code,
  FilmStrip,
  Image as ImageIcon,
  LinkSimple,
  ListBullets,
  ListNumbers,
  MagicWand,
  Minus,
  Paperclip,
  Quotes,
  TextB,
  TextHThree,
  TextHTwo,
  TextItalic,
  TextStrikethrough,
  TreeStructure,
  YoutubeLogo,
} from '@phosphor-icons/react';
import Video from './extensions/Video';
import { admin } from '../../lib/api';

const Btn = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
    className={`press w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
      active ? 'bg-ink/[0.09] text-ink' : 'text-ink-2 hover:text-ink hover:bg-ink/[0.05]'
    }`}
  >
    {children}
  </button>
);

const Sep = () => <span className="w-px h-5 bg-line mx-1" />;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Link the first mention of every other post/paper's title or keywords,
// Wikipedia style. Skips code and anything already linked.
const autoLink = (editor, items, selfId) => {
  const linkType = editor.schema.marks.link;
  const { doc } = editor.state;

  const linked = new Set();
  doc.descendants((node) => {
    node.marks?.forEach((m) => m.type === linkType && linked.add(m.attrs.href));
  });

  // Earliest unlinked match of `term` that doesn't overlap `taken`.
  const findFirst = (term, taken) => {
    const re = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRe(term)})(?=$|[^\\p{L}\\p{N}])`, 'giu');
    let found = null;
    doc.descendants((node, pos, parent) => {
      if (found) return false;
      if (parent?.type.spec.code) return false;
      if (!node.isText) return true;
      if (node.marks.some((m) => m.type === linkType || m.type.spec.code)) return false;
      re.lastIndex = 0;
      let m = re.exec(node.text);
      while (m && !found) {
        const from = pos + m.index + m[1].length;
        const to = from + m[2].length;
        if (!taken.some(([x, y]) => from < y && to > x)) found = [from, to];
        m = re.exec(node.text);
      }
      return false;
    });
    return found;
  };

  const targets = items
    .filter((i) => i.id !== selfId && !linked.has(i.path))
    .map((i) => ({
      path: i.path,
      terms: [i.title, ...String(i.keywords || '').split(',')]
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
        .sort((x, y) => y.length - x.length),
    }))
    .filter((t) => t.terms.length)
    .sort((x, y) => y.terms[0].length - x.terms[0].length);

  const tr = editor.state.tr;
  const taken = [];
  for (const t of targets) {
    let best = null;
    for (const term of t.terms) {
      const hit = findFirst(term, taken);
      if (hit && (!best || hit[0] < best[0])) best = hit;
    }
    if (best) {
      tr.addMark(best[0], best[1], linkType.create({ href: t.path }));
      taken.push(best);
    }
  }
  if (taken.length) editor.view.dispatch(tr);
  return taken.length;
};

const LinkPicker = ({ items, onPick, onClose }) => {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items
      .filter((i) => !s || i.title.toLowerCase().includes(s) || String(i.keywords || '').toLowerCase().includes(s))
      .slice(0, 30);
  }, [items, q]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-ink/10" onMouseDown={onClose}>
      <div
        className="w-full max-w-md bg-card border border-line rounded-lg shadow-card overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && onPick(results[0])}
          placeholder="Link to something I wrote..."
          className="w-full bg-transparent px-4 h-12 border-b border-line text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
        />
        <ul className="max-h-[50vh] overflow-y-auto scroll-thin py-1">
          {results.length === 0 && <li className="px-4 py-4 text-[13px] text-ink-2">Nothing published matches.</li>}
          {results.map((i) => (
            <li key={`${i.type}-${i.id}`}>
              <button
                type="button"
                onClick={() => onPick(i)}
                className="w-full text-left px-4 py-2.5 hover:bg-ink/[0.04] flex items-baseline gap-3"
              >
                <span className="label w-10 shrink-0">{i.type === 'paper' ? 'Paper' : 'Post'}</span>
                <span className="text-[14px] text-ink truncate">{i.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * TipTap editor with uploads (R2), embeds, and links to my own writing.
 * Calls onChange({ html, json }) on every change.
 */
const Editor = ({ initialContent, onChange, postId }) => {
  const imageInput = useRef(null);
  const videoInput = useRef(null);
  const fileInput = useRef(null);
  const seeded = useRef(false);
  const [uploading, setUploading] = useState('');
  const [linkables, setLinkables] = useState(null);
  const [picker, setPicker] = useState(false);
  const [note, setNote] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: null, rel: null } },
      }),
      Image,
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder: 'Start writing. Select a word and press the tree icon to link a past post.' }),
      Video,
    ],
    content: initialContent || '',
    onUpdate: ({ editor: ed }) => onChange({ html: ed.getHTML(), json: ed.getJSON() }),
  });

  // Seed content once when editing an existing post (loads async).
  useEffect(() => {
    if (editor && initialContent && !seeded.current) {
      editor.commands.setContent(initialContent);
      seeded.current = true;
    }
  }, [editor, initialContent]);

  const getLinkables = async () => {
    if (linkables) return linkables;
    const d = await admin.linkables();
    setLinkables(d.items);
    return d.items;
  };

  const flash = (text) => {
    setNote(text);
    setTimeout(() => setNote(''), 2600);
  };

  if (!editor) return null;

  const upload = async (file, label, after) => {
    if (!file) return;
    setUploading(label);
    try {
      after(await admin.upload(file));
    } catch (err) {
      flash(err.message || 'Upload failed');
    } finally {
      setUploading('');
    }
  };

  const addLink = () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt('Link URL', editor.getAttributes('link').href || 'https://');
    if (url === null) return;
    if (url === '' || url === 'https://') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutube = () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt('YouTube URL');
    if (url) editor.commands.setYoutubeVideo({ src: url });
  };

  const openPicker = async () => {
    try {
      await getLinkables();
      setPicker(true);
    } catch {
      flash('Could not load your posts.');
    }
  };

  const pick = (item) => {
    setPicker(false);
    const { empty } = editor.state.selection;
    if (empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: item.title, marks: [{ type: 'link', attrs: { href: item.path } }] })
        .run();
    } else {
      editor.chain().focus().setLink({ href: item.path }).run();
    }
  };

  const runAutoLink = async () => {
    try {
      const items = await getLinkables();
      const n = autoLink(editor, items, postId);
      flash(n ? `Linked ${n} mention${n === 1 ? '' : 's'} to past writing.` : 'No mentions of past writing found.');
    } catch {
      flash('Could not load your posts.');
    }
  };

  return (
    <div className="rounded-lg border border-line bg-card">
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-0.5 p-1.5 border-b border-line bg-card/95 backdrop-blur rounded-t-lg">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <TextB size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <TextItalic size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <TextStrikethrough size={16} weight="bold" />
        </Btn>
        <Sep />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading">
          <TextHTwo size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Subheading">
          <TextHThree size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <ListBullets size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListNumbers size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quotes size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
          <Code size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus size={16} weight="bold" />
        </Btn>
        <Sep />
        <Btn onClick={addLink} active={editor.isActive('link')} title="Link to a website">
          <LinkSimple size={16} weight="bold" />
        </Btn>
        <Btn onClick={openPicker} title="Link to my own post or paper">
          <TreeStructure size={16} weight="bold" />
        </Btn>
        <Btn onClick={runAutoLink} title="Auto-link mentions of past writing">
          <MagicWand size={16} weight="bold" />
        </Btn>
        <Sep />
        <Btn onClick={() => imageInput.current?.click()} title="Upload photo" disabled={!!uploading}>
          <ImageIcon size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => videoInput.current?.click()} title="Upload video" disabled={!!uploading}>
          <FilmStrip size={16} weight="bold" />
        </Btn>
        <Btn onClick={addYoutube} title="Embed YouTube">
          <YoutubeLogo size={16} weight="bold" />
        </Btn>
        <Btn onClick={() => fileInput.current?.click()} title="Attach a file" disabled={!!uploading}>
          <Paperclip size={16} weight="bold" />
        </Btn>
        {(uploading || note) && (
          <span className="ml-2 text-[12px] text-ink-2">{uploading ? `Uploading ${uploading}` : note}</span>
        )}
      </div>

      <EditorContent editor={editor} className="prose-article px-5 sm:px-8 py-6" />

      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          upload(e.target.files[0], 'photo', (r) => editor.chain().focus().setImage({ src: r.url, alt: '' }).run());
          e.target.value = '';
        }}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          upload(e.target.files[0], 'video', (r) => editor.chain().focus().setVideo({ src: r.url }).run());
          e.target.value = '';
        }}
      />
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={(e) => {
          upload(e.target.files[0], 'file', (r) =>
            editor
              .chain()
              .focus()
              .insertContent({ type: 'text', text: r.filename, marks: [{ type: 'link', attrs: { href: r.url, class: 'attachment' } }] })
              .run()
          );
          e.target.value = '';
        }}
      />

      {picker && linkables && <LinkPicker items={linkables} onPick={pick} onClose={() => setPicker(false)} />}
    </div>
  );
};

export default Editor;
