import ScrollReveal from '../ui/ScrollReveal';
import ASCIIHeading from '../ui/ASCIIHeading';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { PROJECTS } from '../../lib/constants';
import { ExternalLink, Github } from 'lucide-react';

const ProjectCard = ({ project, delay }) => (
  <ScrollReveal delay={delay}>
    <GlassCard className="overflow-hidden group" padding="p-0">
      {/* Image */}
      <div className="aspect-video overflow-hidden bg-elevated">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-display text-lg text-white font-semibold">{project.title}</h3>
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
        <div className="flex gap-3">
          {project.demoUrl && (
            <GlassButton
              variant="primary"
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2"
            >
              <ExternalLink size={12} />
              Demo
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
