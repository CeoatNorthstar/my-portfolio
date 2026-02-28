import { motion } from 'framer-motion';

const variants = {
  default:
    'border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white',
  primary:
    'border border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/30 text-white',
  ghost:
    'border border-transparent hover:border-white/10 hover:bg-white/5 text-text-2 hover:text-white',
};

const GlassButton = ({
  children,
  variant = 'default',
  className = '',
  href,
  ...props
}) => {
  const classes = `
    inline-flex items-center justify-center gap-2
    px-6 py-3 rounded-xl
    font-medium text-sm font-sans
    backdrop-blur-sm
    transition-all duration-300
    cursor-pointer
    ${variants[variant] || variants.default}
    ${className}
  `;

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default GlassButton;
