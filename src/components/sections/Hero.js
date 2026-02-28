import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import ParticleCanvas from '../canvas/ParticleCanvas';
import AcceleratorMask from '../canvas/AcceleratorMask';
import GlassButton from '../ui/GlassButton';
import { ASCII_ART } from '../../lib/ascii';
import { SITE } from '../../lib/constants';

const letterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 1.2 + i * 0.03, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
};

const AnimatedTitle = ({ text }) => (
  <span className="inline-flex flex-wrap justify-center gap-x-2">
    {text.split('  ').map((word, wi) => (
      <span key={wi} className="inline-flex">
        {word.split('').map((char, ci) => {
          const globalIndex = text.indexOf(word) + ci;
          return (
            <motion.span
              key={ci}
              custom={globalIndex}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
              className={char === '|' ? 'mx-2 text-text-3/30' : ''}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          );
        })}
      </span>
    ))}
  </span>
);

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
    >
      {/* LHC Particle accelerator */}
      <ParticleCanvas />

      {/* Mask — look inside the accelerator tube */}
      <AcceleratorMask />

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pointer-events-none">
        {/* ASCII name */}
        <motion.pre
          className="ascii-art text-[0.25rem] sm:text-[0.4rem] md:text-[0.55rem] lg:text-[0.68rem] xl:text-[0.78rem] text-white/50 mb-8 mx-auto inline-block"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Naol Demisse"
        >
          {ASCII_ART.name}
        </motion.pre>

        {/* Animated subtitle */}
        <div className="font-mono text-text-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-4">
          <AnimatedTitle text={SITE.title} />
        </div>

        {/* Location with fade */}
        <motion.p
          className="font-mono text-text-3/60 text-[10px] tracking-widest mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.8 }}
        >
          {SITE.location}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex gap-4 justify-center pointer-events-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2 }}
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
        transition={{ delay: 3, duration: 1 }}
      >
        <span className="font-mono text-[9px] text-text-3/40 uppercase tracking-[0.25em]">
          scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown size={14} className="text-text-3/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
