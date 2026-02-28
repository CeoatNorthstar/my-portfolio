import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollProgress from './components/layout/ScrollProgress';
import PhysicsCursor from './components/ui/PhysicsCursor';
import Hero from './components/sections/Hero';
import About from './components/sections/About';
import Skills from './components/sections/Skills';
import Experience from './components/sections/Experience';
import Projects from './components/sections/Projects';
import Contact from './components/sections/Contact';
import BlogShell from './components/sections/BlogShell';
import DonatePage from './components/donate/DonatePage';
import SuccessPage from './components/donate/SuccessPage';
import CancelPage from './components/donate/CancelPage';

const HomePage = () => (
  <>
    <Hero />
    <About />
    <Skills />
    <Experience />
    <Projects />
    <BlogShell />
    <Contact />
  </>
);

function App() {
  return (
    <div className="bg-primary text-text-1 min-h-screen">
      <PhysicsCursor />
      <ScrollProgress />
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogShell fullPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/cancel" element={<CancelPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
