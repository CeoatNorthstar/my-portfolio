import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ParticleCanvas from '../canvas/ParticleCanvas';
import AcceleratorMask from '../canvas/AcceleratorMask';
import GlassButton from '../ui/GlassButton';
import { ASCII_ART } from '../../lib/ascii';
import { SITE } from '../../lib/constants';

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Particle accelerator background */}
      <ParticleCanvas />

      {/* Hover mask overlay */}
      <AcceleratorMask />

      {/* Content overlay */}
      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pointer-events-none">
        {/* ASCII name */}
        <motion.pre
          className="ascii-art text-[0.28rem] sm:text-[0.42rem] md:text-[0.58rem] lg:text-[0.72rem] xl:text-[0.8rem] text-white/60 mb-6 mx-auto inline-block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Naol Demisse"
        >
          {ASCII_ART.name}
        </motion.pre>

        {/* Subtitle */}
        <motion.p
          className="font-mono text-text-2 text-xs sm:text-sm tracking-[0.15em] uppercase mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {SITE.title}
        </motion.p>

        {/* Location */}
        <motion.p
          className="font-mono text-text-3 text-xs tracking-wider mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {SITE.location}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex gap-4 justify-center pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <GlassButton
            variant="primary"
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore
          </GlassButton>
          <GlassButton
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Get in Touch
          </GlassButton>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="font-mono text-[10px] text-text-3 uppercase tracking-[0.2em]">
          scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={16} className="text-text-3" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
