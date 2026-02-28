import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const SkillBar = ({ name, level, delay = 0 }) => {
  const [ref, inView] = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-sm text-text-1">{name}</span>
        <span className="font-mono text-xs text-text-3">{level}%</span>
      </div>
      <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{
            duration: 1.2,
            delay: delay * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </div>
    </div>
  );
};

export default SkillBar;
