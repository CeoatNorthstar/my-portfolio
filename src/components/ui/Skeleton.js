// Quiet loading placeholder for lists.
const Skeleton = ({ rows = 3 }) => (
  <div className="space-y-7 animate-pulse" aria-hidden="true">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="space-y-2.5">
        <div className="h-2.5 w-28 rounded bg-ink/[0.06]" />
        <div className="h-4 w-3/4 rounded bg-ink/[0.08]" />
        <div className="h-3 w-full rounded bg-ink/[0.05]" />
      </div>
    ))}
  </div>
);

export default Skeleton;
