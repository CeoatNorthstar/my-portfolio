import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/layout/ScrollProgress';
import PhysicsCursor from './components/ui/PhysicsCursor';
import NewPostBanner from './components/ui/NewPostBanner';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Skills from './components/sections/Skills';
import Projects from './components/sections/Projects';
import ResearchLog from './components/sections/ResearchLog';
import Contact from './components/sections/Contact';
import ContactPage from './components/sections/ContactPage';
import BlogSection from './components/blog/BlogSection';
import BlogList from './components/blog/BlogList';
import BlogPost from './components/blog/BlogPost';
import DonatePage from './components/donate/DonatePage';
import SuccessPage from './components/donate/SuccessPage';
import CancelPage from './components/donate/CancelPage';

// Admin (TipTap editor) is heavy and rarely used — load it on demand only.
const AdminApp = lazy(() => import('./components/admin/AdminApp'));

const HomePage = () => (
  <>
    <Hero />
    <About />
    <Skills />
    <Projects />
    <ResearchLog />
    <BlogSection />
    <Contact />
  </>
);

// Reset scroll on route change (but preserve in-page anchor jumps on home).
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// The posting/admin console lives on eda.naol.me — landing on its root sends
// you straight into the Access-gated console.
const AdminHostRedirect = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const host = window.location.hostname;
    if ((host === 'eda.naol.me' || host.startsWith('eda.')) && !pathname.startsWith('/admin')) {
      navigate('/admin', { replace: true });
    }
  }, [pathname, navigate]);
  return null;
};

function App() {
  return (
    <div className="bg-primary text-text-1 min-h-screen">
      <PhysicsCursor />
      <ScrollProgress />
      <ScrollToTop />
      <AdminHostRedirect />
      <Navbar />
      <NewPostBanner />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/cancel" element={<CancelPage />} />
          <Route
            path="/admin/*"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center">
                    <p className="font-mono text-sm text-text-3">Loading console…</p>
                  </div>
                }
              >
                <AdminApp />
              </Suspense>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
