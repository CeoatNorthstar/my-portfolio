import { useCallback, useEffect, useState } from 'react';
import { admin } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Button, Empty, PageHeader } from './ui';

const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

// One row per reader who paid, for a spreadsheet or a mailing-list import.
const downloadCustomers = (orders) => {
  const people = new Map();
  for (const o of orders) {
    if (o.status === 'pending') continue;
    const p = people.get(o.email) || { email: o.email, name: o.name, country: o.address.country, orders: 0, spent: 0, optIn: false, last: 0 };
    p.orders += 1;
    p.spent += o.total_cents || 0;
    p.optIn = p.optIn || !!o.marketing_opt_in;
    p.last = Math.max(p.last, o.paid_at || o.created_at);
    people.set(o.email, p);
  }
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [['email', 'name', 'country', 'orders', 'spent_usd', 'wants_news', 'last_order']].concat(
    [...people.values()].map((p) => [p.email, p.name, p.country, p.orders, (p.spent / 100).toFixed(2), p.optIn ? 'yes' : 'no', new Date(p.last).toISOString().slice(0, 10)])
  );
  const blob = new Blob([rows.map((r) => r.map(cell).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

// What still has to be done before the store can take orders, with one-click connections.
const Setup = ({ setup, onConnect, connecting, notes }) => {
  const rows = [
    ['Lulu API keys (LULU_CLIENT_KEY, LULU_CLIENT_SECRET)', setup.lulu, setup.lulu && (setup.luluSandbox ? 'sandbox' : 'live')],
    ['Stripe keys (STORE_STRIPE_SECRET_KEY, STORE_STRIPE_PUBLISHABLE_KEY)', setup.stripe, setup.stripe && (setup.stripeTest ? 'test' : 'live')],
    ['Lulu and Stripe in the same mode', setup.lulu && setup.stripe && setup.luluSandbox === setup.stripeTest],
    ['Orders switched on', setup.enabled, setup.enabled ? null : 'STORE_ENABLED is "false" in wrangler.jsonc'],
    ['Stripe Tax', setup.stripeTax, setup.stripeTax ? 'adds sales tax at checkout' : 'set up in Stripe → Tax (business address, registrations)'],
    ['Stripe tells the site about payments', setup.stripeWebhook, null, 'connect-stripe-webhook', setup.stripe],
    ['Lulu tells the site about printing and shipping', null, null, 'connect-lulu-webhook', setup.lulu],
  ];
  return (
    <section className="mb-10 rounded-xl border border-line bg-card p-5">
      <h2 className="label">{setup.open ? 'The store is taking orders' : 'The store is closed'}</h2>
      <ul className="mt-4 space-y-2">
        {rows.map(([label, ok, note, action, ready]) => (
          <li key={label} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
            <span className={ok ? 'text-new-fg' : 'text-ink-3'}>{ok ? '●' : '○'}</span>
            <span className="text-ink">{label}</span>
            {note && <span className="text-ink-3">· {note}</span>}
            {action && ready && (
              <Button variant="ghost" className="ml-auto h-7 px-3 text-[12.5px]" onClick={() => onConnect(action)} disabled={connecting === action}>
                {notes[action] || (connecting === action ? 'Connecting…' : 'Connect')}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Order = ({ order, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');

  const act = async (action) => {
    setBusy(true);
    setProblem('');
    try {
      await admin.orderAction(order.id, action);
      onChanged();
    } catch (err) {
      setProblem(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setOpen((o) => !o);
    if (!events) admin.getOrder(order.id).then((d) => setEvents(d.events)).catch(() => setEvents([]));
  };

  const a = order.address;
  return (
    <li className="py-5">
      <button type="button" onClick={toggle} className="w-full text-left">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[14px] text-ink">
            <span className="font-mono">{order.id}</span> · {order.name}
          </span>
          <span className="font-mono text-[11px] text-ink-3 shrink-0">{formatDate(order.created_at)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[13px] text-ink-2">
          <span className={order.error ? 'text-warn-fg' : 'text-ink'}>{order.status}</span>
          <span>{order.items.map((i) => `${i.qty} × ${i.title}`).join(', ')}</span>
          <span className="font-mono">{money(order.total_cents)}</span>
          {!!order.marketing_opt_in && <span className="badge-new">wants news</span>}
          {order.lulu_cost_cents != null && <span>Lulu ≈ {money(order.lulu_cost_cents)}</span>}
        </div>
        {order.error && <p className="mt-1 text-[13px] text-warn-fg">{order.error}</p>}
      </button>
      {open && (
        <div className="mt-4 pl-4 border-l border-line text-[13px] text-ink-2 space-y-3">
          <p>
            {order.email} · {a.phone}
            <br />
            {a.street1}
            {a.street2 ? `, ${a.street2}` : ''}, {a.city} {a.state} {a.postcode}, {a.country}
          </p>
          <p>
            Shipping {order.shipping_level} {money(order.shipping_cents)} · tax {money(order.tax_cents)} · Lulu job{' '}
            {order.lulu_job_id || '—'}
            {order.lulu_status ? ` (${order.lulu_status})` : ''}
          </p>
          {order.tracking.map((t) => (
            <p key={t.id}>
              {t.carrier} {t.id}{' '}
              {t.urls[0] && (
                <a href={t.urls[0]} target="_blank" rel="noreferrer" className="underline">
                  track
                </a>
              )}
            </p>
          ))}
          {events && (
            <ul className="font-mono text-[11.5px] space-y-1">
              {events.map((e) => (
                <li key={e.id}>
                  {new Date(e.created_at).toLocaleString()} · {e.kind} · {e.detail}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            {order.status === 'paid' && !order.lulu_job_id && (
              <Button onClick={() => act('submit')} disabled={busy}>
                Send to Lulu again
              </Button>
            )}
            {order.lulu_job_id && (
              <Button variant="ghost" onClick={() => act('sync')} disabled={busy}>
                Refresh from Lulu
              </Button>
            )}
          </div>
          {problem && <p className="text-warn-fg">{problem}</p>}
        </div>
      )}
    </li>
  );
};

const OrdersAdmin = () => {
  const [data, setData] = useState(null);
  const [connecting, setConnecting] = useState('');
  const [notes, setNotes] = useState({});

  const load = useCallback(() => {
    admin
      .listOrders()
      .then(setData)
      .catch(() => setData({ setup: null, orders: [] }));
  }, []);
  useEffect(load, [load]);

  const connect = async (action) => {
    setConnecting(action);
    try {
      const r = await admin.storeAction(action);
      setNotes((n) => ({ ...n, [action]: r.created ? 'Connected' : 'Already connected' }));
      load();
    } catch (err) {
      setNotes((n) => ({ ...n, [action]: err.message }));
    } finally {
      setConnecting('');
    }
  };

  return (
    <div>
      <PageHeader title="Orders">
        {data && data.orders.some((o) => o.status !== 'pending') && (
          <Button variant="ghost" onClick={() => downloadCustomers(data.orders)}>
            Download customers
          </Button>
        )}
      </PageHeader>
      {data && data.setup && <Setup setup={data.setup} onConnect={connect} connecting={connecting} notes={notes} />}
      {data && data.orders.length === 0 && <Empty>No orders yet.</Empty>}
      {data && data.orders.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {data.orders.map((o) => (
            <Order key={o.id} order={o} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrdersAdmin;
