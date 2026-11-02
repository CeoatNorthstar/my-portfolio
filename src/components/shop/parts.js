// Pieces shared by the store's pages: header, bag drawer, buttons.
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBagOpen, X } from '@phosphor-icons/react';
import { cartActions, money, onShopHost, shopPath, useCart } from '../../lib/shop';
import ThemeToggle from '../ui/ThemeToggle';
import IconButton from '../ui/IconButton';

export const btn = {
  primary:
    'press inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-ink text-canvas text-[14px] hover:bg-ink/85 disabled:opacity-50 disabled:pointer-events-none',
  ghost:
    'press inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md border border-line text-[14px] text-ink-2 hover:text-ink hover:border-ink/25 disabled:opacity-50 disabled:pointer-events-none',
};

export const field =
  'w-full bg-card border border-line rounded-md px-3 h-11 text-[14.5px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink/35 transition-colors';

export const ShopHeader = ({ onBag }) => {
  const cart = useCart();
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 flex items-center justify-between gap-3 bg-canvas/85 backdrop-blur-md border-b border-line/70">
      <div className="flex items-baseline gap-2.5 min-w-0">
        <a href={onShopHost() ? 'https://naol.me' : '/'} className="font-serif text-[19px] tracking-[-0.01em] text-ink whitespace-nowrap">
          Naol Demisse
        </a>
        <span className="text-ink-3">/</span>
        <Link to={shopPath('/')} className="label hover:text-ink">
          Books
        </Link>
      </div>
      <div className="flex items-center gap-0.5 -mr-1.5">
        <Link
          to={shopPath('/orders')}
          className="press hidden sm:inline-flex items-center h-8 px-3 rounded-md text-[13px] text-ink-2 hover:text-ink"
        >
          Track an order
        </Link>
        {onBag && (
          <button
            type="button"
            onClick={onBag}
            aria-label={`Bag, ${count} ${count === 1 ? 'book' : 'books'}`}
            className="press relative inline-flex items-center justify-center w-9 h-9 rounded-md text-ink-2 hover:text-ink"
          >
            <ShoppingBagOpen size={19} />
            {count > 0 && (
              <span className="absolute top-0.5 right-0 min-w-[16px] h-4 px-1 rounded-full bg-ink text-canvas text-[10px] leading-4 text-center font-mono">
                {count}
              </span>
            )}
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};

export const TestBanner = () => (
  <div className="bg-warn-bg text-warn-fg text-[12.5px] text-center px-4 py-2">
    Test mode: nothing is charged or printed. Pay with card 4242 4242 4242 4242, any future date, any CVC.
  </div>
);

export const Qty = ({ value, onChange }) => (
  <div className="inline-flex items-center border border-line rounded-md h-8">
    <button type="button" aria-label="One fewer" onClick={() => onChange(value - 1)} className="press w-8 h-8 inline-flex items-center justify-center text-ink-2 hover:text-ink">
      <Minus size={13} weight="bold" />
    </button>
    <span className="w-6 text-center font-mono text-[13px] text-ink">{value}</span>
    <button
      type="button"
      aria-label="One more"
      disabled={value >= 10}
      onClick={() => onChange(value + 1)}
      className="press w-8 h-8 inline-flex items-center justify-center text-ink-2 hover:text-ink disabled:opacity-40"
    >
      <Plus size={13} weight="bold" />
    </button>
  </div>
);

// Cart lines joined to the catalog (anything no longer for sale drops out).
export const bagLines = (cart, books) =>
  cart.map((i) => ({ ...i, book: (books || []).find((b) => b.slug === i.slug) })).filter((l) => l.book);

export const BagDrawer = ({ open, onClose, books, ordersOpen }) => {
  const cart = useCart();
  const navigate = useNavigate();
  const lines = bagLines(cart, books);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.book.priceCents, 0);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="bag"
            role="dialog"
            aria-label="Your bag"
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-card border-l border-line flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
          >
            <div className="h-14 px-5 flex items-center justify-between border-b border-line shrink-0">
              <h2 className="font-serif text-[22px] tracking-[-0.01em] text-ink">Your bag</h2>
              <IconButton label="Close" onClick={onClose}>
                <X size={16} weight="bold" />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin px-5 py-4">
              {lines.length === 0 && <p className="text-[14px] text-ink-2 pt-6">Your bag is empty.</p>}
              <ul className="divide-y divide-line">
                {lines.map((l) => (
                  <li key={l.slug} className="py-4 flex gap-4">
                    <img src={`/store/${l.slug}/front.jpg`} alt="" className="w-14 h-[86px] object-cover rounded-sm border border-line" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-[17px] leading-tight text-ink">{l.book.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-ink-2">Paperback</p>
                      <div className="mt-2.5 flex items-center justify-between">
                        <Qty value={l.qty} onChange={(q) => cartActions.set(l.slug, q)} />
                        <span className="font-mono text-[13px] text-ink">{money(l.qty * l.book.priceCents)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {lines.length > 0 && (
              <div className="border-t border-line px-5 py-5 shrink-0">
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] text-ink-2">Subtotal</span>
                  <span className="font-mono text-[15px] text-ink">{money(subtotal)}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-ink-3">Shipping is priced for your address at checkout.</p>
                <button
                  type="button"
                  disabled={!ordersOpen}
                  onClick={() => {
                    onClose();
                    navigate(shopPath('/checkout'));
                  }}
                  className={`${btn.primary} w-full mt-4`}
                >
                  {ordersOpen ? 'Checkout' : 'Orders open soon'}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
