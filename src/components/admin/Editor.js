import { useRef, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Placeholder } from '@tiptap/extensions';
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link as LinkIcon, Image as ImageIcon, Film, Paperclip, Youtube as YoutubeIcon,
} from 'lucide-react';
import Video from './extensions/Video';
import { admin } from '../../lib/api';

const Btn = ({ onClick, active, title, children, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`p-2 rounded-lg transition-colors ${
      active
        ? 'bg-white/[0.12] text-white'
        : 'text-text-2 hover:text-white hover:bg-white/[0.06]'
    } disabled:opacity-40`}
  >
    {children}
  </button>
);

/**
 * TipTap rich editor with media uploads (R2) and embeds.
 * Calls onChange({ html, json }) on every change.
 */
const Editor = ({ initialContent, onChange }) => {
  const imageInput = useRef(null);
  const videoInput = useRef(null);
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const seeded = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
        },
      }),
      Image,
      Youtube.configure({ controls: true, nocookie: true }),
      Placeholder.configure({ placeholder: 'Write your research, notes, ideas…' }),
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

  if (!editor) return null;

  const upload = async (file, after) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await admin.upload(file);
      after(res);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt('Link URL');
    if (url === null) return;
    if (url === '') editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: url }).run();
  };

  const addYoutube = () => {
    // eslint-disable-next-line no-alert
    const url = window.prompt('YouTube URL');
    if (url) editor.commands.setYoutubeVideo({ src: url });
  };

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-white/[0.06] sticky top-0 bg-elevated/80 backdrop-blur z-10">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={15} /></Btn>
        <span className="w-px h-5 bg-white/[0.08] mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote"><Quote size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={15} /></Btn>
        <span className="w-px h-5 bg-white/[0.08] mx-1" />
        <Btn onClick={addLink} active={editor.isActive('link')} title="Link"><LinkIcon size={15} /></Btn>
        <Btn onClick={() => imageInput.current?.click()} title="Upload image" disabled={uploading}><ImageIcon size={15} /></Btn>
        <Btn onClick={() => videoInput.current?.click()} title="Upload video" disabled={uploading}><Film size={15} /></Btn>
        <Btn onClick={() => fileInput.current?.click()} title="Attach file" disabled={uploading}><Paperclip size={15} /></Btn>
        <Btn onClick={addYoutube} title="Embed YouTube"><YoutubeIcon size={15} /></Btn>
        {uploading && <span className="ml-2 font-mono text-[10px] text-text-3">uploading…</span>}
      </div>

      <EditorContent
        editor={editor}
        className="post-body px-5 py-4 min-h-[320px] max-h-[60vh] overflow-y-auto"
      />

      {/* Hidden inputs */}
      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => upload(e.target.files[0], (r) => editor.chain().focus().setImage({ src: r.url, alt: r.filename }).run())}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => upload(e.target.files[0], (r) => editor.commands.setVideo({ src: r.url }))}
      />
      <input
        ref={fileInput}
        type="file"
        hidden
        onChange={(e) =>
          upload(e.target.files[0], (r) =>
            editor
              .chain()
              .focus()
              .insertContent(`<a href="${r.url}" target="_blank" rel="noopener noreferrer">📎 ${r.filename}</a>`)
              .run()
          )
        }
      />
    </div>
  );
};

export default Editor;
