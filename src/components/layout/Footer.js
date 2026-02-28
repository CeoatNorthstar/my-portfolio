import { Github, Linkedin, Mail } from 'lucide-react';
import { SITE } from '../../lib/constants';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-black/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-text-3">
          &copy; {year} {SITE.name}
        </p>

        <div className="flex items-center gap-5">
          <a
            href={SITE.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-3 hover:text-white transition-colors duration-300"
            aria-label="GitHub"
          >
            <Github size={16} />
          </a>
          <a
            href={SITE.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-3 hover:text-white transition-colors duration-300"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="text-text-3 hover:text-white transition-colors duration-300"
            aria-label="Email"
          >
            <Mail size={16} />
          </a>
        </div>

        <p className="font-mono text-[10px] text-text-3/50">
          Built with particles and purpose
        </p>
      </div>
    </footer>
  );
};

export default Footer;
