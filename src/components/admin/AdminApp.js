import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Inbox, Plus, ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { admin, setAdminToken } from '../../lib/api';
import GlassButton from '../ui/GlassButton';
import PostsAdmin from './PostsAdmin';
import PostEditor from './PostEditor';
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
      setError('Invalid token.');
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <ShieldAlert size={40} className="text-text-3 mb-6" />
      <h1 className="font-display text-2xl text-white font-semibold mb-3">Admin access</h1>
      <p className="text-text-2 text-sm max-w-md mb-6">
        Enter your admin token to sign in. (Cloudflare Access, if configured, signs you in
        automatically.)
      </p>
      <form onSubmit={submit} className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          autoFocus
          className="w-full bg-transparent border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-text-3 focus:border-white/25 focus:outline-none font-mono text-center"
        />
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        <GlassButton type="submit" variant="primary" className="w-full" disabled={checking}>
          {checking ? 'Checking…' : 'Sign in'}
        </GlassButton>
      </form>
      <a href="/" className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-2 hover:text-white">
        <ArrowLeft size={13} /> Home
      </a>
    </div>
  );
};

const navItem = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
    isActive ? 'bg-white/[0.08] text-white' : 'text-text-2 hover:text-white hover:bg-white/[0.04]'
  }`;

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pt-24 max-w-6xl mx-auto px-4 md:px-6 grid md:grid-cols-[200px_1fr] gap-6">
      <aside className="md:sticky md:top-24 h-max">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-3 mb-3 px-3">Console</p>
        <nav className="space-y-1">
          <NavLink to="/admin" end className={navItem}><FileText size={15} /> Posts</NavLink>
          <NavLink to="/admin/comments" className={navItem}><MessageSquare size={15} /> Comments</NavLink>
          <NavLink to="/admin/messages" className={navItem}><Inbox size={15} /> Messages</NavLink>
        </nav>
        <button
          onClick={() => navigate('/admin/new')}
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-sm text-white transition-colors"
        >
          <Plus size={15} /> New Post
        </button>
        <button
          onClick={() => {
            setAdminToken('');
            window.location.reload();
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-text-3 hover:text-white text-xs transition-colors"
        >
          <LogOut size={13} /> Sign out
        </button>
      </aside>
      <main className="pb-24">{children}</main>
    </div>
  );
};

const AdminApp = () => {
  const [state, setState] = useState('checking'); // checking | ok | denied

  useEffect(() => {
    admin
      .me()
      .then(() => setState('ok'))
      .catch(() => setState('denied'));
  }, []);

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-text-3">Verifying access…</p>
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
        <Route path="comments" element={<CommentsAdmin />} />
        <Route path="messages" element={<MessagesAdmin />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminApp;
