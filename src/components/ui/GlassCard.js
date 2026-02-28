import { motion } from 'framer-motion';

const GlassCard = ({
  children,
  className = '',
  hover = true,
  padding = 'p-6 md:p-8',
  as = 'div',
  ...props
}) => {
  const Component = motion[as] || motion.div;

  return (
    <Component
      className={`
        rounded-2xl
        bg-white/[0.03]
        backdrop-blur-md
        border border-white/[0.08]
        ${padding}
        ${hover ? 'hover:border-white/[0.15] hover:bg-white/[0.05]' : ''}
        transition-all duration-500 ease-out
        ${className}
      `}
      whileHover={hover ? { y: -4, transition: { duration: 0.3 } } : {}}
      {...props}
    >
      {children}
    </Component>
  );
};

export default GlassCard;
