import { motion } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import { SITE, EXPERIENCE, BIO } from '../../lib/constants';

const statCard = (value, label, delay) => (
  <ScrollReveal key={label} delay={delay}>
    <GlassCard padding="p-5" className="text-center group">
      <motion.p
        className="font-display text-xl text-white font-bold group-hover:scale-110 transition-transform duration-300"
      >
        {value}
      </motion.p>
      <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.2em] mt-1.5">
        {label}
      </p>
    </GlassCard>
  </ScrollReveal>
);

const About = () => {
  return (
    <section id="about" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="about" />
        <h2 className="text-heading text-white mb-2">About</h2>
        <p className="text-text-3 text-sm mb-12 font-mono">{'// who is naol demisse?'}</p>
      </ScrollReveal>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left — Identity card (2 cols) */}
        <ScrollReveal delay={0.1} className="md:col-span-2">
          <GlassCard className="h-full flex flex-col items-center text-center">
            {/* Avatar */}
            <motion.div
              className="w-20 h-20 rounded-full border border-white/[0.08] bg-white/[0.02] flex items-center justify-center mb-5 relative"
              whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
            >
              <span className="font-display text-xl text-white/80 font-bold">ND</span>
              {/* Online indicator */}
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400/80 border-2 border-primary"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            <h3 className="font-display text-lg text-white font-semibold mb-0.5">
              {SITE.name}
            </h3>
            <p className="font-mono text-[10px] text-text-3 tracking-wider uppercase mb-1">
              Founder of Sentinel Collective
            </p>
            <p className="font-mono text-[10px] text-text-3/50 mb-6">{SITE.location}</p>

            {/* Divider */}
            <div className="w-8 h-px bg-white/[0.06] mb-6" />

            {/* Top skills */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {EXPERIENCE.topSkills.map((skill, i) => (
                <motion.span
                  key={skill}
                  className="px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] font-mono text-[9px] text-text-2 uppercase tracking-wider"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.15)',
                  }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </GlassCard>
        </ScrollReveal>

        {/* Right — Bio (3 cols) */}
        <ScrollReveal delay={0.2} className="md:col-span-3">
          <GlassCard className="h-full" hover={false}>
            <p className="text-text-1 leading-relaxed mb-5 text-[15px]">
              {BIO.summary}
            </p>
            <p className="text-text-2 leading-relaxed mb-6 text-sm">
              {BIO.detail}
            </p>

            {/* Tagline */}
            <motion.div
              className="border-l-2 border-white/[0.1] pl-4 mb-8"
              whileInView={{ borderColor: 'rgba(255,255,255,0.2)' }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <p className="font-mono text-sm text-white/60 italic">
                "{BIO.tagline}"
              </p>
            </motion.div>

            {/* Research */}
            <p className="font-mono text-[9px] text-text-3 uppercase tracking-[0.2em] mb-3">
              Active Research
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE.research.map((area, i) => (
                <motion.span
                  key={area}
                  className="px-3 py-1.5 rounded-xl border border-white/[0.05] bg-white/[0.02] font-mono text-xs text-text-2 cursor-default"
                  whileHover={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    scale: 1.02,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  {area}
                </motion.span>
              ))}
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {statCard('CTCs', 'Research', 0.3)}
        {statCard('Sentinel Collective', 'Company', 0.4)}
        {statCard('Quantum + AI', 'Focus', 0.5)}
      </div>
    </section>
  );
};

export default About;
