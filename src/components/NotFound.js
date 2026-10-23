import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  useEffect(() => {
    document.title = 'Not found — Naol Demisse';
  }, []);
  return (
    <main className="min-h-[100svh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label">404</p>
        <h1 className="mt-4 font-serif text-[34px] leading-[1.15] tracking-[-0.02em] text-ink">
          This page was in a superposition of existing and not existing.
        </h1>
        <p className="mt-4 text-[15px] text-ink-2">You looked, and it collapsed into the second one.</p>
        <Link
          to="/"
          className="press mt-8 inline-flex items-center h-10 px-5 rounded-md bg-ink text-canvas text-[14px] hover:bg-ink/85"
        >
          Back to the card
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
