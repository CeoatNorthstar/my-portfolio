module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Channel-based so alpha utilities (e.g. bg-white/[0.03]) stay theme-aware.
        white: 'rgb(var(--c-white) / <alpha-value>)',
        black: 'rgb(var(--c-black) / <alpha-value>)',
        void: 'rgb(var(--c-void) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        elevated: 'rgb(var(--c-elevated) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        hover: 'rgb(var(--c-hover) / <alpha-value>)',
        star: 'rgb(var(--c-star) / <alpha-value>)',
        'text-1': 'rgb(var(--c-text-1) / <alpha-value>)',
        'text-2': 'rgb(var(--c-text-2) / <alpha-value>)',
        'text-3': 'rgb(var(--c-text-3) / <alpha-value>)',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
