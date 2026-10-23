// Tiny line drawing of an electron-positron annihilation diagram.
const Feynman = ({ className = '' }) => (
  <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M6 6 L34 32 L6 58" />
      <path d="M114 6 L86 32 L114 58" />
      <path d="M34 32 q4 -6 8 0 t8 0 t8 0 t8 0 t8 0 t8 0" />
      <path d="M17 13.5 l4 1 -1 4" />
      <path d="M21 47 l-4 1.5 1 -4" />
    </g>
    <circle cx="34" cy="32" r="1.8" fill="currentColor" />
    <circle cx="86" cy="32" r="1.8" fill="currentColor" />
  </svg>
);

export default Feynman;
