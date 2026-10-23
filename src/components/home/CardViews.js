import { useState } from 'react';
import { ArrowUpRight, Check, Copy, PaperPlaneTilt } from '@phosphor-icons/react';
import { ABOUT, INTRO, SITE } from '../../lib/site';
import { sendContact } from '../../lib/api';

const Intro = () => (
  <div>
    <p className="text-[15px] leading-[1.65] text-ink max-w-[34ch]">{INTRO}</p>
    <ul className="mt-5 space-y-2">
      {SITE.fields.map((field, i) => (
        <li key={field} className="flex items-baseline gap-3">
          <span className="font-mono text-[10.5px] text-ink-3 tabular-nums">0{i + 1}</span>
          <span className={`text-[14px] text-ink ${field === 'Special relativity' ? 'contract' : ''}`}>{field}</span>
        </li>
      ))}
    </ul>
  </div>
);

const About = () => (
  <div className="h-full overflow-y-auto scroll-thin fade-bottom pr-2 pb-6">
    {ABOUT.map((p) => (
      <p key={p.slice(0, 24)} className="text-[14px] leading-[1.65] text-ink [&+p]:mt-3">
        {p}
      </p>
    ))}
    <p className="mt-4 font-serif italic text-[15px] text-ink-2">{SITE.motto}</p>
  </div>
);

const Row = ({ label, children }) => (
  <div className="flex items-baseline gap-4 py-[5px]">
    <span className="label w-[68px] shrink-0">{label}</span>
    <span className="text-[14px] text-ink min-w-0 truncate">{children}</span>
  </div>
);

const NoteForm = ({ onDone }) => {
  const [form, setForm] = useState({ email: '', message: '', website: '' });
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      await sendContact(form);
      setState('sent');
    } catch (err) {
      setError(err.message);
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="h-full flex flex-col justify-center">
        <p className="font-serif text-[20px]">Thank you.</p>
        <p className="text-[14px] text-ink-2 mt-1">Your note landed. I read every one.</p>
        <button type="button" onClick={onDone} className="mt-4 self-start text-[13px] text-ink-2 hover:text-ink link-quiet">
          Back
        </button>
      </div>
    );
  }

  const field =
    'w-full bg-transparent border border-line rounded-md px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink/30 transition-colors';

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="email"
        required
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={field}
      />
      <textarea
        required
        rows={3}
        placeholder="What's on your mind?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={`${field} resize-none`}
      />
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="press inline-flex items-center gap-2 h-8 px-3.5 rounded-md bg-ink text-canvas text-[13px] hover:bg-ink/85 disabled:opacity-50"
        >
          <PaperPlaneTilt size={14} weight="bold" />
          {state === 'sending' ? 'Sending' : 'Send'}
        </button>
        <button type="button" onClick={onDone} className="text-[13px] text-ink-2 hover:text-ink">
          Cancel
        </button>
        {error && <span className="text-[12px] text-warn-fg truncate">{error}</span>}
      </div>
    </form>
  );
};

const Contact = () => {
  const [writing, setWriting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (writing) return <NoteForm onDone={() => setWriting(false)} />;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  return (
    <div>
      <Row label="Email">
        <span className="inline-flex items-center gap-2">
          <a href={`mailto:${SITE.email}`} className="link-quiet">
            {SITE.email}
          </a>
          <button type="button" onClick={copy} aria-label="Copy email" className="text-ink-3 hover:text-ink">
            {copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />}
          </button>
        </span>
      </Row>
      <Row label="GitHub">
        <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1">
          CeoatNorthstar <ArrowUpRight size={12} weight="bold" className="text-ink-3" />
        </a>
      </Row>
      <Row label="LinkedIn">
        <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="link-quiet inline-flex items-center gap-1">
          naoldemisse <ArrowUpRight size={12} weight="bold" className="text-ink-3" />
        </a>
      </Row>
      <Row label="Based in">{SITE.location}</Row>
      <button
        type="button"
        onClick={() => setWriting(true)}
        className="press mt-3 inline-flex items-center gap-2 h-8 px-3.5 rounded-md border border-line text-[13px] text-ink hover:border-ink/25"
      >
        Leave a note
      </button>
    </div>
  );
};

const Donate = () => (
  <div className="max-w-[36ch]">
    <span className="badge-new">Soon</span>
    <p className="mt-3 text-[14px] leading-[1.65] text-ink">
      Independent research runs on curiosity, time and a lot of coffee. A way to support the work is on its way.
    </p>
    <p className="mt-3 text-[14px] leading-[1.65] text-ink-2">
      Until then, reading a paper and passing it along helps more than you would think.
    </p>
  </div>
);

const VIEWS = { intro: Intro, about: About, contact: Contact, donate: Donate };

const CardView = ({ view }) => {
  const View = VIEWS[view] || Intro;
  return <View />;
};

export default CardView;
