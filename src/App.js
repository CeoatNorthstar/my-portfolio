import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './components/home/Home';
import NotFound from './components/NotFound';
import Eggs from './components/eggs/Eggs';

// Full pages and the admin console load on demand.
const PostPage = lazy(() => import('./components/blog/PostPage'));
const PaperPage = lazy(() => import('./components/papers/PaperPage'));
const AdminApp = lazy(() => import('./components/admin/AdminApp'));

const Loading = () => (
  <div className="min-h-[100svh] flex items-center justify-center">
    <span className="label animate-pulse">Loading</span>
  </div>
);

// The posting console lives on eda.naol.me; its root goes straight to /admin.
const AdminHostRedirect = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const host = window.location.hostname;
    if (host.startsWith('eda.') && !pathname.startsWith('/admin')) navigate('/admin', { replace: true });
  }, [pathname, navigate]);
  return null;
};

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <div className="grain min-h-[100svh] bg-canvas text-ink">
      <AdminHostRedirect />
      {!isAdmin && <Eggs />}
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<Home />} />
          <Route path="/contact" element={<Home />} />
          <Route path="/donate" element={<Home />} />
          <Route path="/blog" element={<Home />} />
          <Route path="/papers" element={<Home />} />
          <Route path="/blog/:slug" element={<PostPage />} />
          <Route path="/papers/:slug" element={<PaperPage />} />
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
