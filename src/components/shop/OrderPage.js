import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Copy, Truck } from '@phosphor-icons/react';
import { cartActions, getOrder, money, shopPath } from '../../lib/shop';
import { formatDate } from '../../lib/format';
import { ShopHeader, btn } from './parts';

const STEPS = ['Paid', 'Printing', 'Shipped', 'Delivered'];
const REACHED = { pending: -1, paid: 0, submitted: 0, printing: 1, shipped: 2, delivered: 3 };
const FINISHED = ['delivered', 'rejected', 'canceled'];

const Timeline = ({ status }) => {
  const reached = REACHED[status] ?? -1;
  return (
    <ol className="mt-8 grid grid-cols-4">
      {STEPS.map((step, i) => (
        <li key={step} className="relative">
          <span className={`block h-px ${i <= reached ? 'bg-ink' : 'bg-line'}`} />
          <span
            className={`absolute -top-[9px] left-0 w-[18px] h-[18px] rounded-full border flex items-center justify-center ${
              i <= reached ? 'bg-ink border-ink text-canvas' : 'bg-card border-line'
            }`}
          >
            {i <= reached && <Check size={10} weight="bold" />}
          </span>
          <span className={`block mt-4 text-[12.5px] ${i <= reached ? 'text-ink' : 'text-ink-3'}`}>{step}</span>
        </li>
      ))}
    </ol>
  );
};

const OrderPage = () => {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('t') || '';
  const [order, setOrder] = useState(null);
  const [problem, setProblem] = useState('');
  const [fresh, setFresh] = useState(false);
  const [copied, setCopied] = useState(false);

  // Coming back from Stripe (session_id in the link) confirms the payment; after that the
  // page checks in now and then while the book is being printed and posted.
  useEffect(() => {
    document.title = `Order ${id} — Naol Demisse`;
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    let timer = null;
    let tries = 0;
    const load = (sid) =>
      getOrder(id, token, sid)
        .then(({ order: o }) => {
          setOrder(o);
          if (sid && o.status !== 'pending') {
            setFresh(true);
            cartActions.clear();
            navigate(`${shopPath(`/order/${id}`)}?t=${token}`, { replace: true });
          }
          tries += 1;
          const wait = o.status === 'pending' && sid && tries < 10 ? 3000 : 60_000;
          if (!FINISHED.includes(o.status)) timer = setTimeout(() => load(o.status === 'pending' ? sid : null), wait);
        })
        .catch((err) => setProblem(err.status === 404 ? 'We could not find that order.' : err.message));
    load(sessionId);
    return () => clearTimeout(timer);
  }, [id, token, navigate]);

  const link = `${window.location.origin}${shopPath(`/order/${id}`)}?t=${token}`;

  return (
    <>
      <ShopHeader />
      <main className="max-w-2xl mx-auto px-5 pt-12 pb-20">
        {problem && (
          <div className="text-center pt-8">
            <p className="text-[15px] text-ink-2">{problem}</p>
            <Link to={shopPath('/orders')} className={`${btn.ghost} mt-6`}>
              Look up an order
            </Link>
          </div>
        )}
        {!problem && !order && <p className="label animate-pulse text-center pt-10">Finding your order</p>}
        {order && (
          <>
            <p className="label">Order {order.id}</p>
            <h1 className="mt-3 font-serif text-[38px] sm:text-[44px] leading-[1.02] tracking-[-0.03em] text-ink">
              {fresh ? 'Thank you.' : order.statusLabel}
            </h1>
            {fresh && (
              <p className="mt-3 text-[15px] leading-[1.6] text-ink-2">
                Your payment went through and the order is on its way to the printer. A receipt is in your inbox.
              </p>
            )}
            {order.status === 'pending' && (
              <p className="mt-3 text-[15px] text-ink-2">We have not received the payment for this order yet.</p>
            )}
            {['rejected', 'canceled'].includes(order.status) ? (
              <p className="mt-4 text-[14.5px] text-warn-fg">
                Something went wrong with printing this order. I will be in touch by email, and you will not pay for books you
                do not receive.
              </p>
            ) : (
              order.status !== 'pending' && <Timeline status={order.status} />
            )}

            {order.tracking.length > 0 && (
              <section className="mt-10">
                <h2 className="label">Tracking</h2>
                <ul className="mt-3 space-y-2">
                  {order.tracking.map((t) => (
                    <li key={t.id || t.urls[0]} className="flex items-center gap-3 text-[14px] text-ink">
                      <Truck size={17} className="text-ink-2 shrink-0" />
                      <span className="flex-1 min-w-0 truncate">
                        {t.carrier || 'Courier'} {t.id && <span className="font-mono text-[12.5px] text-ink-2">{t.id}</span>}
                      </span>
                      {t.urls[0] && (
                        <a href={t.urls[0]} target="_blank" rel="noreferrer" className="text-ink underline underline-offset-4 decoration-ink/30">
                          Track parcel
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="mt-10 border-t border-line pt-6">
              <ul className="space-y-2">
                {order.items.map((i) => (
                  <li key={i.slug} className="flex justify-between text-[14px]">
                    <span className="text-ink">
                      {i.title} <span className="text-ink-2">× {i.qty}</span>
                    </span>
                    <span className="font-mono text-ink">{money(i.qty * i.unit_cents)}</span>
                  </li>
                ))}
                <li className="flex justify-between text-[14px]">
                  <span className="text-ink-2">{order.shippingLabel}</span>
                  <span className="font-mono text-ink">{money(order.shippingCents)}</span>
                </li>
                {order.taxCents > 0 && (
                  <li className="flex justify-between text-[14px]">
                    <span className="text-ink-2">Sales tax</span>
                    <span className="font-mono text-ink">{money(order.taxCents)}</span>
                  </li>
                )}
                <li className="flex justify-between text-[15px] pt-2 border-t border-line">
                  <span className="text-ink">Total</span>
                  <span className="font-mono text-ink">{money(order.totalCents)}</span>
                </li>
              </ul>
              <p className="mt-5 text-[13px] text-ink-2">
                Shipping to {order.shipTo.name}, {order.shipTo.city}, {order.shipTo.country}
                {order.paidAt ? ` · ordered ${formatDate(order.paidAt)}` : ''}
              </p>
            </section>

            <section className="mt-10 rounded-xl border border-line bg-card p-5">
              <p className="text-[13.5px] text-ink">Keep this link to follow your order:</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate font-mono text-[12px] text-ink-2">{link}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(link).then(() => setCopied(true));
                  }}
                  className="press inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line text-[12.5px] text-ink-2 hover:text-ink"
                >
                  <Copy size={13} /> {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-3 text-[12.5px] text-ink-3">
                You can also find it again with your order number and email under Track an order.
              </p>
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default OrderPage;
