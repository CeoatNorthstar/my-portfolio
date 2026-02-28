import { motion } from 'framer-motion';
import { ASCII_ART } from '../../lib/ascii';

const ASCIIHeading = ({ text, className = '' }) => {
  const key = text.toLowerCase().replace(/\s+/g, '');
  const art = ASCII_ART[key];

  if (!art) {
    return (
      <h2 className={`font-mono text-text-3 text-sm uppercase tracking-widest ${className}`}>
        {`// ${text}`}
      </h2>
    );
  }

  return (
    <motion.pre
      className={`
        ascii-art
        text-[0.35rem] sm:text-[0.5rem] md:text-[0.65rem] lg:text-[0.75rem]
        text-text-3/40 select-none mb-4
        overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.2 }}
      aria-label={text}
      role="heading"
    >
      {art}
    </motion.pre>
  );
};

export default ASCIIHeading;
