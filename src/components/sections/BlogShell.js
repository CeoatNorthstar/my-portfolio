import { motion } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';

const SkeletonCard = ({ delay }) => (
  <ScrollReveal delay={delay}>
    <GlassCard hover={false} className="overflow-hidden">
      {/* Image skeleton */}
      <div className="h-40 bg-white/[0.02] rounded-lg mb-4 overflow-hidden">
        <motion.div
          className="h-full w-full bg-white/[0.02]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Title skeleton */}
      <div className="h-4 bg-white/[0.04] rounded w-3/4 mb-3" />

      {/* Text skeletons */}
      <div className="h-3 bg-white/[0.03] rounded w-full mb-2" />
      <div className="h-3 bg-white/[0.03] rounded w-5/6 mb-4" />

      {/* Tag skeletons */}
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-white/[0.03] rounded" />
        <div className="h-5 w-12 bg-white/[0.03] rounded" />
      </div>
    </GlassCard>
  </ScrollReveal>
);

const BlogShell = ({ fullPage = false }) => {
  if (!fullPage) {
    // Homepage preview section
    return (
      <section id="blog" className="section-container">
        <ScrollReveal>
          <ASCIIHeading text="blog" />
          <h2 className="text-heading text-white mb-4">Research & Writing</h2>
          <p className="text-text-2 text-sm mb-12 max-w-xl">
            Notes on quantum theory, systems architecture, and the intersections of physics
            and computation. Coming soon.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} delay={0.1 + i * 0.1} />
          ))}
        </div>
      </section>
    );
  }

  // Full /blog page
  return (
    <div className="min-h-screen pt-24 section-container">
      <ASCIIHeading text="blog" />
      <h1 className="text-heading text-white mb-4">Blog</h1>
      <p className="text-text-2 mb-12">
        Research notes and technical writing. Posts will appear here soon.
      </p>

      {/* Search placeholder */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search posts..."
          disabled
          className="w-full max-w-md bg-transparent border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-text-3 font-sans opacity-50 cursor-not-allowed"
        />
      </div>

      {/* Filter pills placeholder */}
      <div className="flex gap-2 mb-12">
        {['All', 'Quantum', 'AI', 'Systems'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] text-text-3 uppercase tracking-wider opacity-50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Empty state */}
      <GlassCard hover={false} className="text-center py-16">
        <p className="font-mono text-text-3 text-sm">No posts yet. Check back soon.</p>
      </GlassCard>
    </div>
  );
};

export default BlogShell;
