import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import { SKILLS } from '../../lib/constants';

/**
 * Industry-standard skills display
 * No percentages — grouped by domain with interactive category tabs
 * and hover micro-interactions.
 */

const categories = ['All', ...new Set(SKILLS.map((s) => s.category))];

const SkillChip = ({ skill, index }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{
      duration: 0.4,
      delay: index * 0.03,
      ease: [0.16, 1, 0.3, 1],
      layout: { type: 'spring', stiffness: 300, damping: 30 },
    }}
    whileHover={{
      scale: 1.05,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.2)',
    }}
    className="group relative px-5 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] cursor-default transition-colors duration-300"
  >
    <div className="flex items-center gap-3">
      <span className="w-1.5 h-1.5 rounded-full bg-white/40 group-hover:bg-white transition-colors duration-300" />
      <span className="font-sans text-sm text-text-2 group-hover:text-white transition-colors duration-300">
        {skill.name}
      </span>
    </div>

    <motion.div
      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
      }}
    />
  </motion.div>
);

const Skills = () => {
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? SKILLS : SKILLS.filter((s) => s.category === active);

  return (
    <section id="skills" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="skills" />
        <h2 className="text-heading text-white mb-4">Tech Stack</h2>
        <p className="text-text-2 text-sm mb-10 max-w-xl">
          Technologies I work with across research, engineering, and product development.
        </p>
      </ScrollReveal>

      {/* Category tabs */}
      <ScrollReveal delay={0.1}>
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`
                relative px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider
                transition-all duration-300 border
                ${active === cat
                  ? 'text-white border-white/20 bg-white/[0.08]'
                  : 'text-text-3 border-white/[0.04] bg-transparent hover:text-text-2 hover:border-white/[0.08]'
                }
              `}
            >
              {active === cat && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full bg-white/[0.06] border border-white/[0.12]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Skills grid */}
      <ScrollReveal delay={0.15}>
        <GlassCard hover={false} padding="p-6 md:p-8">
          <motion.div layout className="flex flex-wrap gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((skill, i) => (
                <SkillChip key={skill.name} skill={skill} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>

          <motion.p
            key={active}
            className="mt-6 font-mono text-[10px] text-text-3/50 uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {filtered.length} {filtered.length === 1 ? 'technology' : 'technologies'}
            {active !== 'All' && ` in ${active}`}
          </motion.p>
        </GlassCard>
      </ScrollReveal>
    </section>
  );
};

export default Skills;
