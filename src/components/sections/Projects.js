import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { PROJECTS } from '../../lib/constants';
import { ExternalLink, Github, FileText, BatteryCharging, Package, Atom } from 'lucide-react';

// Pick a themed icon for the placeholder cover based on the project category.
const coverIcon = (category) => {
  if (/paper|research/i.test(category)) return FileText;
  if (/macos|app/i.test(category)) return BatteryCharging;
  if (/python|package/i.test(category)) return Package;
  return Atom;
};

const ProjectCover = ({ project }) => {
  if (project.image) {
    return (
      <div className="aspect-video overflow-hidden bg-elevated">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
          loading="lazy"
        />
      </div>
    );
  }

  // Themed placeholder when no screenshot is provided.
  const Icon = coverIcon(project.category);
  return (
    <div className="relative aspect-video overflow-hidden bg-elevated flex items-center justify-center">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(120% 120% at 30% 20%, rgba(255,255,255,0.06) 0%, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <Icon
        size={40}
        className="relative text-text-2/60 group-hover:text-white/80 group-hover:scale-110 transition-all duration-700"
        strokeWidth={1.25}
      />
    </div>
  );
};

const ProjectCard = ({ project, delay }) => (
  <ScrollReveal delay={delay}>
    <GlassCard className="overflow-hidden group h-full flex flex-col" padding="p-0">
      <ProjectCover project={project} />

      {/* Content */}
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display text-lg text-white font-semibold flex items-center gap-2">
              {project.title}
              {project.wip && (
                <span className="px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-400/10 font-mono text-[9px] text-amber-300 uppercase tracking-wider">
                  In Dev
                </span>
              )}
            </h3>
            <p className="font-mono text-[10px] text-text-3 uppercase tracking-widest">
              {project.category}
            </p>
          </div>
        </div>

        <p className="text-text-2 text-sm mb-4 leading-relaxed">{project.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] font-mono text-[10px] text-text-3"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-3 mt-auto">
          {project.demoUrl && (
            <GlassButton
              variant="primary"
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2"
            >
              <ExternalLink size={12} />
              {project.demoLabel || 'Demo'}
            </GlassButton>
          )}
          {project.githubUrl && (
            <GlassButton
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2"
            >
              <Github size={12} />
              Source
            </GlassButton>
          )}
        </div>
      </div>
    </GlassCard>
  </ScrollReveal>
);

const Projects = () => {
  return (
    <section id="projects" className="section-container">
      <ScrollReveal>
        <ASCIIHeading text="projects" />
        <h2 className="text-heading text-white mb-12">Projects</h2>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-6">
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.id} project={project} delay={0.1 + i * 0.1} />
        ))}
      </div>
    </section>
  );
};

export default Projects;
