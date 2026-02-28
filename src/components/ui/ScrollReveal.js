import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const ScrollReveal = ({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  once = true,
}) => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: once });

  const offsets = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none: { y: 0, x: 0 },
  };

  const offset = offsets[direction] || offsets.up;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, ...offset }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
