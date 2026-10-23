import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { ArrowUpRight, SignOut } from '@phosphor-icons/react';
import { admin, setAdminToken } from '../../lib/api';
import ThemeToggle from '../ui/ThemeToggle';
import { Button, input } from './ui';
import PostsAdmin from './PostsAdmin';
import PostEditor from './PostEditor';
import PapersAdmin from './PapersAdmin';
import PaperEditor from './PaperEditor';
import CommentsAdmin from './CommentsAdmin';
import MessagesAdmin from './MessagesAdmin';

const AccessGate = ({ onAuthed }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setChecking(true);
    setError('');
    setAdminToken(token.trim());
    try {
      await admin.me();
      onAuthed();
    } catch {
      setAdminToken('');
      setError('That token did not work.');
      setChecking(false);
    }
  };

  return (
    <main className="min-h-[100svh] flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs text-center">
        <p className="label">Console</p>
        <h1 className="mt-3 font-serif text-[30px] tracking-[-0.02em]">Sign in</h1>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          autoFocus
          className={`${input} mt-6 text-center font-mono`}
        />
        {error && <p className="mt-2 text-[12.5px] text-warn-fg">{error}</p>}
        <Button type="submit" className="w-full mt-3" disabled={checking}>
          {checking ? 'Checking' : 'Sign in'}
        </Button>
        <a href="/" className="mt-8 inline-block text-[13px] text-ink-2 hover:text-ink">
          Back to the site
        </a>
      </form>
    </main>
  );
};

const tab = ({ isActive }) =>
  `press h-8 px-3 inline-flex items-center rounded-md text-[13.5px] transition-colors ${
    isActive ? 'bg-ink/[0.07] text-ink' : 'text-ink-2 hover:text-ink'
  }`;

const AdminLayout = ({ children }) => (
  <div className="min-h-[100svh]">
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-line/70">
      <div className="max-w-5xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1 overflow-x-auto">
          <span className="font-serif text-[18px] tracking-tight mr-3 hidden sm:inline">Console</span>
          <NavLink to="/admin" end className={tab}>
            Writing
          </NavLink>
          <NavLink to="/admin/papers" className={tab}>
            Papers
          </NavLink>
          <NavLink to="/admin/comments" className={tab}>
            Comments
          </NavLink>
          <NavLink to="/admin/messages" className={tab}>
            Messages
          </NavLink>
        </nav>
        <div className="flex items-center gap-1 shrink-0">
          <a href="/" className="hidden sm:inline-flex items-center gap-1 h-8 px-2 text-[13px] text-ink-2 hover:text-ink">
            Site <ArrowUpRight size={12} weight="bold" />
          </a>
          <ThemeToggle />
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => {
              setAdminToken('');
              window.location.reload();
            }}
            className="press w-8 h-8 inline-flex items-center justify-center rounded-md text-ink-2 hover:text-ink hover:bg-ink/[0.06]"
          >
            <SignOut size={16} weight="bold" />
          </button>
        </div>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-24">{children}</main>
  </div>
);

const AdminApp = () => {
  const [state, setState] = useState('checking'); // checking | ok | denied

  useEffect(() => {
    document.title = 'Console — Naol Demisse';
    admin
      .me()
      .then(() => setState('ok'))
      .catch(() => setState('denied'));
  }, []);

  if (state === 'checking') {
    return (
      <div className="min-h-[100svh] flex items-center justify-center">
        <span className="label animate-pulse">Checking access</span>
      </div>
    );
  }
  if (state === 'denied') return <AccessGate onAuthed={() => setState('ok')} />;

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<PostsAdmin />} />
        <Route path="new" element={<PostEditor />} />
        <Route path="edit/:id" element={<PostEditor />} />
        <Route path="papers" element={<PapersAdmin />} />
        <Route path="papers/new" element={<PaperEditor />} />
        <Route path="papers/:id" element={<PaperEditor />} />
        <Route path="comments" element={<CommentsAdmin />} />
        <Route path="messages" element={<MessagesAdmin />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
