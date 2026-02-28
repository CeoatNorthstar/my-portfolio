import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import { SITE, EXPERIENCE, BIO } from '../../lib/constants';

const About = () => {
  const researchAreas = EXPERIENCE.research;
  const topSkills = EXPERIENCE.topSkills;

  return (
    <section id="about" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="about" />
        <h2 className="text-heading text-white mb-12">About</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left — Identity */}
        <ScrollReveal delay={0.1}>
          <GlassCard className="h-full">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-24 h-24 rounded-full border border-white/10 bg-white/[0.03] flex items-center justify-center mb-5">
                <span className="font-display text-2xl text-white font-bold">ND</span>
              </div>
              <h3 className="font-display text-xl text-white font-semibold mb-1">
                {SITE.name}
              </h3>
              <p className="font-mono text-xs text-text-3 tracking-wider uppercase mb-4">
                Founder of AxionsLab
              </p>
              <p className="font-mono text-xs text-text-3 mb-6">{SITE.location}</p>

              {/* Top skills pills */}
              <div className="flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[10px] text-text-2 uppercase tracking-wider"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>

        {/* Right — Bio */}
        <ScrollReveal delay={0.2}>
          <GlassCard className="h-full">
            <p className="text-text-2 leading-relaxed mb-6">{BIO.summary}</p>
            <p className="text-text-2 leading-relaxed mb-6 text-sm">{BIO.detail}</p>
            <p className="font-mono text-sm text-white/70 italic">"{BIO.tagline}"</p>

            {/* Research interests */}
            <div className="mt-8">
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-widest mb-3">
                Research Focus
              </p>
              <div className="flex flex-wrap gap-2">
                {researchAreas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] font-mono text-xs text-text-2"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Research', value: 'QEC' },
          { label: 'Company', value: 'AxionsLab' },
          { label: 'Focus', value: 'Quantum + AI' },
        ].map((stat, i) => (
          <ScrollReveal key={stat.label} delay={0.3 + i * 0.1}>
            <GlassCard padding="p-5" className="text-center">
              <p className="font-display text-lg text-white font-semibold">{stat.value}</p>
              <p className="font-mono text-[10px] text-text-3 uppercase tracking-widest mt-1">
                {stat.label}
              </p>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
};

export default About;
