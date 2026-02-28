import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import { EXPERIENCE, EDUCATION, CERTIFICATIONS } from '../../lib/constants';
import { Briefcase, GraduationCap, Award } from 'lucide-react';

const TimelineItem = ({ icon: Icon, title, subtitle, period, children, delay }) => (
  <ScrollReveal delay={delay}>
    <div className="relative pl-8 pb-10 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-[7px] top-6 bottom-0 w-[1px] bg-white/[0.06]" />

      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-[15px] h-[15px] rounded-full border border-white/20 bg-primary flex items-center justify-center">
        <div className="w-[5px] h-[5px] rounded-full bg-white/60" />
      </div>

      <GlassCard padding="p-5 md:p-6" hover={false}>
        <div className="flex items-start gap-3 mb-3">
          <Icon size={16} className="text-text-3 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-display text-base text-white font-semibold">{title}</h3>
            <p className="font-mono text-xs text-text-3">{subtitle}</p>
          </div>
        </div>
        <p className="font-mono text-[10px] text-text-3 uppercase tracking-widest mb-3">
          {period}
        </p>
        {children}
      </GlassCard>
    </div>
  </ScrollReveal>
);

const Experience = () => {
  return (
    <section id="experience" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="experience" />
        <h2 className="text-heading text-white mb-12">Experience</h2>
      </ScrollReveal>

      <div className="max-w-2xl mx-auto">
        {/* AxionsLab */}
        <TimelineItem
          icon={Briefcase}
          title={`${EXPERIENCE.company} — ${EXPERIENCE.role}`}
          subtitle={EXPERIENCE.location}
          period={EXPERIENCE.period}
          delay={0.1}
        >
          <p className="text-text-2 text-sm mb-4">{EXPERIENCE.description}</p>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE.research.map((r) => (
              <span
                key={r}
                className="px-2.5 py-1 rounded-md border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] text-text-2"
              >
                {r}
              </span>
            ))}
          </div>
        </TimelineItem>

        {/* Education */}
        <TimelineItem
          icon={GraduationCap}
          title={EDUCATION.program}
          subtitle={EDUCATION.institution}
          period={EDUCATION.period}
          delay={0.2}
        >
          <p className="text-text-2 text-sm">
            Comprehensive full stack development covering frontend and backend technologies.
          </p>
        </TimelineItem>

        {/* Certifications */}
        <TimelineItem
          icon={Award}
          title="Certifications"
          subtitle=""
          period=""
          delay={0.3}
        >
          <ul className="space-y-2">
            {CERTIFICATIONS.map((cert) => (
              <li key={cert.title} className="flex items-start gap-2">
                <span className="text-text-3 mt-1.5 text-[6px]">&#9679;</span>
                <div>
                  <p className="text-text-2 text-sm">{cert.title}</p>
                  <p className="font-mono text-[10px] text-text-3">{cert.org}</p>
                </div>
              </li>
            ))}
          </ul>
        </TimelineItem>
      </div>
    </section>
  );
};

export default Experience;
