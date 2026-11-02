import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { getQuote, getShopConfig, money, shopPath, startCheckout, useCart } from '../../lib/shop';
import { formatDate } from '../../lib/format';
import { countries, SUBDIVISIONS } from './regions';
import { ShopHeader, TestBanner, bagLines, btn, field } from './parts';

const EMPTY = { name: '', email: '', phone: '', street1: '', street2: '', city: '', state: '', postcode: '', country: 'US' };

// Stripe.js must come from js.stripe.com; load it once, when payment starts.
let stripeJs = null;
const loadStripe = () => {
  if (!stripeJs) {
    stripeJs = new Promise((resolve, reject) => {
      if (window.Stripe) return resolve(window.Stripe);
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = () => resolve(window.Stripe);
      s.onerror = () => {
        stripeJs = null;
        reject(new Error('Could not load the payment form. Check your connection and try again.'));
      };
      document.head.appendChild(s);
      return undefined;
    });
  }
  return stripeJs;
};

const Payment = ({ publishableKey, clientSecret }) => {
  const ref = useRef(null);
  const [problem, setProblem] = useState('');
  useEffect(() => {
    let checkout = null;
    let cancelled = false;
    loadStripe()
      .then((Stripe) => Stripe(publishableKey).initEmbeddedCheckout({ fetchClientSecret: () => Promise.resolve(clientSecret) }))
      .then((c) => {
        if (cancelled) c.destroy();
        else {
          checkout = c;
          c.mount(ref.current);
        }
      })
      .catch((err) => setProblem(err.message));
    return () => {
      cancelled = true;
      if (checkout) checkout.destroy();
    };
  }, [publishableKey, clientSecret]);
  return (
    <>
      {problem && <p className="text-[13.5px] text-warn-fg">{problem}</p>}
      <div ref={ref} className="min-h-[420px]" />
    </>
  );
};

const Input = ({ label, className = '', ...props }) => (
  <label className={`block ${className}`}>
    <span className="label">{label}</span>
    <input className={`${field} mt-1.5`} {...props} />
  </label>
);

// Lulu's dates are calendar days ("2026-11-12"); read them as local days, not UTC midnight.
const day = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return formatDate(new Date(y, m - 1, d).getTime(), { year: undefined });
};

const days = (q) => {
  if (!q.minDelivery) return '';
  const a = day(q.minDelivery);
  const b = q.maxDelivery ? day(q.maxDelivery) : '';
  return b && b !== a ? `Arrives ${a} – ${b}` : `Arrives around ${a}`;
};

const CheckoutPage = () => {
  const cart = useCart();
  const [config, setConfig] = useState(null);
  const [address, setAddress] = useState(EMPTY);
  const [quotes, setQuotes] = useState(null);
  const [level, setLevel] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [payment, setPayment] = useState(null);
  const [optIn, setOptIn] = useState(false);
  const countryList = useMemo(countries, []);

  useEffect(() => {
    document.title = 'Checkout — Naol Demisse';
    getShopConfig()
      .then(setConfig)
      .catch(() => setConfig({ open: false, books: [] }));
  }, []);

  const lines = bagLines(cart, config && config.books);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.book.priceCents, 0);
  const quote = quotes && quotes.find((q) => q.level === level);
  const states = SUBDIVISIONS[address.country];

  // Any change to the address or the bag means shipping has to be priced again.
  const set = (key) => (e) => {
    const value = e.target.value;
    setAddress((a) => ({ ...a, [key]: value, ...(key === 'country' ? { state: '' } : {}) }));
    setQuotes(null);
  };
  useEffect(() => setQuotes(null), [cart]);

  const findShipping = async (e) => {
    e.preventDefault();
    setBusy(true);
    setProblem('');
    try {
      const r = await getQuote(cart, address);
      setQuotes(r.quotes);
      setLevel(r.quotes[0] ? r.quotes[0].level : '');
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    setBusy(true);
    setProblem('');
    try {
      const r = await startCheckout(cart, address, level, optIn);
      setPayment(r);
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (config && !lines.length && !payment) {
    return (
      <>
        <ShopHeader />
        <main className="max-w-xl mx-auto px-5 pt-20 text-center">
          <h1 className="font-serif text-[34px] tracking-[-0.02em] text-ink">Your bag is empty</h1>
          <Link to={shopPath('/')} className={`${btn.ghost} mt-8`}>
            Back to the shelf
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <ShopHeader />
      {config && config.test && <TestBanner />}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
        <div>
          <Link to={shopPath('/')} className="press inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
            <ArrowLeft size={14} weight="bold" /> Back to the shelf
          </Link>
          <h1 className="mt-5 font-serif text-[38px] leading-none tracking-[-0.03em] text-ink">Checkout</h1>

          {config && !config.open && (
            <p className="mt-6 text-[14.5px] text-ink-2">Orders open soon. Your bag will be waiting.</p>
          )}

          {payment ? (
            <section className="mt-8">
              <p className="label mb-4">Payment · order {payment.orderId}</p>
              <Payment publishableKey={config.stripePublishableKey} clientSecret={payment.clientSecret} />
            </section>
          ) : (
            config &&
            config.open && (
              <form onSubmit={findShipping} className="mt-8 space-y-8">
                <fieldset className="space-y-4">
                  <legend className="label mb-3">Contact</legend>
                  <Input label="Full name" value={address.name} onChange={set('name')} autoComplete="name" required />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Email" type="email" value={address.email} onChange={set('email')} autoComplete="email" required />
                    <Input label="Phone (for the courier)" type="tel" value={address.phone} onChange={set('phone')} autoComplete="tel" required />
                  </div>
                </fieldset>
                <fieldset className="space-y-4">
                  <legend className="label mb-3">Shipping address</legend>
                  <label className="block">
                    <span className="label">Country</span>
                    <select className={`${field} mt-1.5`} value={address.country} onChange={set('country')} autoComplete="country">
                      {countryList.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input label="Street address" value={address.street1} onChange={set('street1')} autoComplete="address-line1" required />
                  <Input label="Apartment, suite (optional)" value={address.street2} onChange={set('street2')} autoComplete="address-line2" />
                  <div className="grid sm:grid-cols-3 gap-4">
                    <Input label="City" value={address.city} onChange={set('city')} autoComplete="address-level2" required />
                    {states ? (
                      <label className="block">
                        <span className="label">State / province</span>
                        <select className={`${field} mt-1.5`} value={address.state} onChange={set('state')} autoComplete="address-level1" required>
                          <option value="">Choose</option>
                          {states.map((s) => (
                            <option key={s.code} value={s.code}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <Input label="Region code (optional)" value={address.state} onChange={set('state')} maxLength={3} />
                    )}
                    <Input label="Postcode" value={address.postcode} onChange={set('postcode')} autoComplete="postal-code" required />
                  </div>
                </fieldset>

                {!quotes && (
                  <button type="submit" disabled={busy} className={btn.primary}>
                    {busy ? 'Asking the printer…' : 'See shipping options'}
                  </button>
                )}

                {quotes && (
                  <fieldset>
                    <legend className="label mb-3">Shipping</legend>
                    <div className="border border-line rounded-md divide-y divide-line">
                      {quotes.map((q) => (
                        <label key={q.level} className="flex items-center gap-3 px-4 py-3.5 cursor-pointer">
                          <input type="radio" name="level" checked={level === q.level} onChange={() => setLevel(q.level)} className="accent-current" />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] text-ink">{q.label}</span>
                            <span className="block text-[12.5px] text-ink-2">{days(q)}</span>
                          </span>
                          <span className="font-mono text-[13px] text-ink">{money(q.shippingCents)}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-[12.5px] text-ink-3">
                      Each copy is printed for you, which takes a few days before it ships.
                    </p>
                    <label className="mt-6 flex items-start gap-3 text-[13.5px] text-ink-2 cursor-pointer">
                      <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1 accent-current" />
                      <span>Email me when the next book is out. Nothing else, and you can say stop any time.</span>
                    </label>
                    <button type="button" onClick={pay} disabled={busy || !level} className={`${btn.primary} mt-6`}>
                      {busy ? 'One moment…' : 'Continue to payment'}
                    </button>
                  </fieldset>
                )}
                {problem && <p className="text-[13.5px] text-warn-fg">{problem}</p>}
              </form>
            )
          )}
        </div>

        <aside className="lg:pt-[92px]">
          <div className="border border-line rounded-xl bg-card p-5">
            <h2 className="label">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((l) => (
                <li key={l.slug} className="flex items-center gap-3">
                  <img src={`/store/${l.slug}/front.jpg`} alt="" className="w-9 h-14 object-cover rounded-sm border border-line" />
                  <span className="flex-1 min-w-0 text-[13.5px] text-ink">
                    {l.book.title}
                    <span className="block text-[12px] text-ink-2">Qty {l.qty}</span>
                  </span>
                  <span className="font-mono text-[13px] text-ink">{money(l.qty * l.book.priceCents)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 pt-4 border-t border-line space-y-1.5 text-[13.5px]">
              <div className="flex justify-between">
                <dt className="text-ink-2">Subtotal</dt>
                <dd className="font-mono text-ink">{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Shipping</dt>
                <dd className="font-mono text-ink">{quote ? money(quote.shippingCents) : '—'}</dd>
              </div>
              {config && config.tax && (
                <div className="flex justify-between">
                  <dt className="text-ink-2">Sales tax</dt>
                  <dd className="text-[12.5px] text-ink-3">added at payment</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 text-[15px]">
                <dt className="text-ink">{config && config.tax ? 'Total before tax' : 'Total'}</dt>
                <dd className="font-mono text-ink">{money(subtotal + (quote ? quote.shippingCents : 0))}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </main>
    </>
  );
};

export default CheckoutPage;
