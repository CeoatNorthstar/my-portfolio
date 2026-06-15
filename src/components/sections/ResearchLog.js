import { motion } from 'framer-motion';
import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import { RESEARCH_LOG } from '../../lib/constants';
import { ArrowUpRight, Radio } from 'lucide-react';

const LogEntry = ({ entry, delay, isLast }) => {
  const Wrapper = entry.link ? motion.a : motion.div;
  const linkProps = entry.link
    ? { href: entry.link, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <ScrollReveal delay={delay}>
      <div className="relative pl-8 pb-8 last:pb-0">
        {/* Timeline line */}
        {!isLast && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-white/[0.06]" />}

        {/* Timeline dot */}
        <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border border-white/20 bg-primary flex items-center justify-center">
          <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
        </div>

        <Wrapper
          {...linkProps}
          className={`block group ${entry.link ? 'cursor-pointer' : ''}`}
          whileHover={entry.link ? { x: 2 } : undefined}
        >
          <GlassCard padding="p-5" hover={!!entry.link}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className="font-display text-base text-white font-semibold flex items-center gap-1.5">
                {entry.title}
                {entry.link && (
                  <ArrowUpRight
                    size={14}
                    className="text-text-3 group-hover:text-white transition-colors"
                  />
                )}
              </h3>
              <span className="font-mono text-[10px] text-text-3 uppercase tracking-widest shrink-0 pt-1">
                {entry.year}
              </span>
            </div>
            <p className="text-text-2 text-sm leading-relaxed mb-3">{entry.note}</p>
            <span className="inline-block px-2.5 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] text-text-2">
              {entry.tag}
            </span>
          </GlassCard>
        </Wrapper>
      </div>
    </ScrollReveal>
  );
};

const ResearchLog = () => {
  return (
    <section id="research" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="research" />
        <h2 className="text-heading text-white mb-4">Research Log</h2>
        <p className="text-text-3 text-sm mb-10 font-mono">{'// field notes from the work'}</p>
      </ScrollReveal>

      {/* Currently exploring */}
      <ScrollReveal delay={0.1}>
        <GlassCard hover={false} className="mb-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={14} className="text-green-400/80" />
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-[0.2em]">
              Currently Exploring
            </p>
          </div>
          <p className="text-text-1 text-[15px] leading-relaxed">{RESEARCH_LOG.current}</p>
        </GlassCard>
      </ScrollReveal>

      {/* Timeline */}
      <div className="max-w-2xl">
        {RESEARCH_LOG.entries.map((entry, i) => (
          <LogEntry
            key={entry.title}
            entry={entry}
            delay={0.15 + i * 0.1}
            isLast={i === RESEARCH_LOG.entries.length - 1}
          />
        ))}
      </div>
    </section>
  );
};

export default ResearchLog;
