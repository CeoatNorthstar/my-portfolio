import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import PostCard from './PostCard';
import { listPosts } from '../../lib/api';

// Homepage "Research & Writing" preview — latest published posts.
const BlogSection = () => {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    listPosts()
      .then((d) => setPosts(d.posts.slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  return (
    <section id="blog" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="blog" />
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <h2 className="text-heading text-white mb-4">Research &amp; Writing</h2>
            <p className="text-text-2 text-sm max-w-xl">
              Notes on quantum theory, systems architecture, and the intersections of physics
              and computation.
            </p>
          </div>
          <Link
            to="/blog"
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-text-2 hover:text-white transition-colors"
          >
            All posts <ArrowRight size={13} />
          </Link>
        </div>
      </ScrollReveal>

      {posts && posts.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <ScrollReveal key={post.id} delay={0.1 + i * 0.1}>
              <PostCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal>
          <GlassCard hover={false} className="text-center py-16">
            <p className="font-mono text-text-3 text-sm">
              {posts === null ? 'Loading posts…' : 'No posts yet — first one is on its way.'}
            </p>
          </GlassCard>
        </ScrollReveal>
      )}
    </section>
  );
};

export default BlogSection;
