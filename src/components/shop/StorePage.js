import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowsClockwise } from '@phosphor-icons/react';
import { cartActions, getShopConfig, money } from '../../lib/shop';
import { BagDrawer, ShopHeader, TestBanner, btn } from './parts';

const Shelf = lazy(() => import('./Shelf'));

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
};

// Without WebGL the shelf is simply the covers in a row.
const FlatShelf = ({ books, onSelect }) => (
  <div className="h-full flex items-end justify-center gap-6 pb-6">
    {books.map((b) => (
      <button key={b.slug} type="button" onClick={() => onSelect(b.slug)} className="press w-[38%] max-w-[210px]">
        <img src={`/store/${b.slug}/front.jpg`} alt={b.title} className="w-full rounded-sm shadow-card border border-line" />
      </button>
    ))}
  </div>
);

const Intro = ({ books, onSelect }) => (
  <div>
    <h1 className="font-serif text-[40px] sm:text-[46px] leading-none tracking-[-0.03em] text-ink">Books</h1>
    <p className="mt-4 text-[15px] leading-[1.65] text-ink-2 max-w-[42ch]">
      Two novels, printed to order and posted to you from the printer nearest your address. Take one off the shelf.
    </p>
    <ul className="mt-7 divide-y divide-line border-y border-line">
      {books.map((b) => (
        <li key={b.slug}>
          <button type="button" onClick={() => onSelect(b.slug)} className="w-full py-4 flex items-center gap-4 text-left group">
            <img src={`/store/${b.slug}/front.jpg`} alt="" className="w-11 h-[68px] object-cover rounded-sm border border-line" />
            <span className="flex-1 min-w-0">
              <span className="block font-serif text-[19px] leading-tight text-ink group-hover:underline underline-offset-4 decoration-ink/30">
                {b.title}
              </span>
              <span className="block mt-1 text-[12.5px] text-ink-2">
                Paperback · {b.pages} pages · {b.year}
              </span>
            </span>
            <span className="font-mono text-[13px] text-ink">{money(b.priceCents)}</span>
          </button>
        </li>
      ))}
    </ul>
  </div>
);

const Spec = ({ label, children }) => (
  <div>
    <dt className="label">{label}</dt>
    <dd className="mt-1 text-[13.5px] text-ink">{children}</dd>
  </div>
);

const BookPanel = ({ book, open, canTurn, onBack, onTurn, onAdded }) => {
  const [added, setAdded] = useState(false);
  useEffect(() => setAdded(false), [book.slug]);
  return (
    <div>
      <button type="button" onClick={onBack} className="press inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
        <ArrowLeft size={14} weight="bold" /> All books
      </button>
      <h1 className="mt-5 font-serif text-[36px] sm:text-[40px] leading-[1.02] tracking-[-0.03em] text-ink">{book.title}</h1>
      <p className="mt-2 text-[13.5px] text-ink-2">
        {book.author} · {book.year}
      </p>
      <p className="mt-5 font-serif italic text-[19px] leading-snug text-ink">{book.tagline}</p>
      <div className="mt-3 space-y-3 text-[14.5px] leading-[1.65] text-ink-2">
        {book.blurb.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-4">
        <Spec label="Format">Paperback</Spec>
        <Spec label="Size">5.5 × 8.5 in</Spec>
        <Spec label="Pages">{book.pages}</Spec>
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className="font-serif text-[28px] leading-none text-ink mr-2">{money(book.priceCents)}</span>
        {open ? (
          <button
            type="button"
            className={btn.primary}
            onClick={() => {
              cartActions.add(book.slug);
              setAdded(true);
            }}
          >
            Add to bag
          </button>
        ) : (
          <span className="label">Orders open soon</span>
        )}
        {canTurn && (
          <button type="button" className={btn.ghost} onClick={onTurn}>
            <ArrowsClockwise size={15} /> Turn over
          </button>
        )}
      </div>
      {added && (
        <p className="mt-3 text-[13px] text-ink-2">
          Added to your bag.{' '}
          <button type="button" onClick={onAdded} className="text-ink underline underline-offset-4 decoration-ink/30">
            View bag
          </button>
        </p>
      )}
    </div>
  );
};

const StorePage = () => {
  const [config, setConfig] = useState(null);
  const [selected, setSelected] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const webgl = useMemo(hasWebGL, []);

  useEffect(() => {
    document.title = 'Books — Naol Demisse';
    getShopConfig()
      .then(setConfig)
      .catch(() => setConfig({ open: false, books: [] }));
  }, []);

  // Clicking the book that is already off the shelf turns it over.
  const select = useCallback(
    (slug, fromShelf) => {
      if (slug && slug === selected) {
        if (fromShelf) setFlipped((f) => !f);
        return;
      }
      setSelected(slug);
      setFlipped(false);
    },
    [selected]
  );

  const books = (config && config.books) || [];
  const book = books.find((b) => b.slug === selected);

  return (
    <>
      <ShopHeader onBag={() => setBagOpen(true)} />
      {config && config.test && <TestBanner />}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <section className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-4 lg:gap-12 items-center pt-2 lg:pt-6">
          <div className="relative h-[50svh] min-h-[330px] lg:h-[calc(100svh-120px)] lg:max-h-[760px] -mx-4 sm:mx-0">
            {books.length > 0 &&
              (webgl ? (
                <Suspense fallback={<p className="label absolute inset-0 flex items-center justify-center animate-pulse">Lighting the lamp</p>}>
                  <Shelf books={books} selected={selected} flipped={flipped} onSelect={select} className="absolute inset-0" />
                </Suspense>
              ) : (
                <FlatShelf books={books} onSelect={select} />
              ))}
          </div>
          <aside className="lg:py-10">
            {book ? (
              <BookPanel
                book={book}
                open={!!(config && config.open)}
                canTurn={webgl}
                onBack={() => select(null)}
                onTurn={() => setFlipped((f) => !f)}
                onAdded={() => setBagOpen(true)}
              />
            ) : (
              config && <Intro books={books} onSelect={select} />
            )}
          </aside>
        </section>
      </main>
      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} books={books} ordersOpen={!!(config && config.open)} />
    </>
  );
};

export default StorePage;
