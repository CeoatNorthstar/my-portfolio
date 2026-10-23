// Shared bits for the admin console.

export const input =
  'w-full bg-card border border-line rounded-md px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink/30 transition-colors';

const VARIANTS = {
  primary: 'bg-ink text-canvas hover:bg-ink/85',
  ghost: 'border border-line text-ink-2 hover:text-ink hover:border-ink/25',
  danger: 'border border-line text-warn-fg hover:bg-warn-bg hover:border-transparent',
};

export const Button = ({ variant = 'primary', className = '', children, ...props }) => (
  <button
    type="button"
    className={`press inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-[13.5px] disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Field = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="label">{label}</span>
    <div className="mt-2">{children}</div>
    {hint && <p className="mt-1.5 text-[12px] leading-[1.5] text-ink-3">{hint}</p>}
  </label>
);

export const PageHeader = ({ title, children }) => (
  <div className="flex items-end justify-between gap-4 mb-8">
    <h1 className="font-serif text-[34px] leading-none tracking-[-0.02em] text-ink">{title}</h1>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

export const Status = ({ status }) =>
  status === 'published' ? (
    <span className="badge-new">Published</span>
  ) : (
    <span className="inline-flex items-center h-[18px] px-[7px] rounded-full bg-sunk text-ink-2 font-mono text-[9.5px] uppercase tracking-[0.08em]">
      Draft
    </span>
  );

export const Empty = ({ children }) => (
  <p className="py-16 text-center font-serif italic text-[18px] text-ink-2">{children}</p>
);
