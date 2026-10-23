import { forwardRef } from 'react';

// Square, quiet icon button used for panel and reader chrome.
const IconButton = forwardRef(({ label, active = false, className = '', children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={`press inline-flex items-center justify-center w-8 h-8 rounded-md text-ink-2 hover:text-ink hover:bg-ink/[0.06] disabled:opacity-40 disabled:pointer-events-none ${
      active ? 'bg-ink/[0.08] text-ink' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </button>
));

export default IconButton;
