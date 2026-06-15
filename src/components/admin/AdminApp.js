import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { FileText, MessageSquare, Inbox, Plus, ShieldAlert, ArrowLeft } from 'lucide-react';
import { admin } from '../../lib/api';
import PostsAdmin from './PostsAdmin';
import PostEditor from './PostEditor';
import CommentsAdmin from './CommentsAdmin';
import MessagesAdmin from './MessagesAdmin';

const AccessGate = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
    <ShieldAlert size={40} className="text-text-3 mb-6" />
    <h1 className="font-display text-2xl text-white font-semibold mb-3">Admin access required</h1>
    <p className="text-text-2 text-sm max-w-md mb-2">
      This area is protected by Cloudflare Access. Sign in with the authorized account to continue.
    </p>
    <p className="font-mono text-[11px] text-text-3 max-w-md">
      Locally, set <code className="text-text-2">DEV_ADMIN_BYPASS=true</code> in{' '}
      <code className="text-text-2">.dev.vars</code> and run <code className="text-text-2">npm run cf:dev</code>.
    </p>
    <a href="/" className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-2 hover:text-white">
      <ArrowLeft size={13} /> Home
    </a>
  </div>
);

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
  if (state === 'denied') return <AccessGate />;

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
