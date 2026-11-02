// Store orders: who is buying, paying through Stripe, handing the order to Lulu, and
// following Lulu's print job until it is delivered.
import { now, uuid } from './util.js';
import { LEVELS, createPrintJob, getPrintJob, jobProgress, luluConfigured, luluSandbox } from './lulu.js';
import { stripe, stripeKey, stripePublishableKey, stripeTestMode } from './stripe.js';

// Open only when Lulu and Stripe are both set up, and both are live or both are test:
// a live payment must never become a sandbox print job, or the reverse.
export const storeOpen = (env) =>
  env.STORE_ENABLED !== 'false' &&
  luluConfigured(env) &&
  !!stripeKey(env) &&
  !!stripePublishableKey(env) &&
  luluSandbox(env) === stripeTestMode(env) &&
  stripePublishableKey(env).startsWith('pk_test_') === stripeTestMode(env);

export const publicOrigin = (env, request) => env.SITE_URL || new URL(request.url).origin;

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n));
export const newOrderId = () => `ND-${[...randomBytes(6)].map((b) => ALPHABET[b % 32]).join('')}`;
export const newToken = () => [...randomBytes(16)].map((b) => b.toString(16).padStart(2, '0')).join('');

// Shipping details from the checkout form -> [address, null] or [null, what is wrong].
export const cleanAddress = (input) => {
  const s = (v, max = 120) => String(v == null ? '' : v).trim().slice(0, max);
  const a = {
    name: s(input && input.name, 80),
    email: s(input && input.email, 160).toLowerCase(),
    phone: s(input && input.phone, 20),
    street1: s(input && input.street1),
    street2: s(input && input.street2),
    city: s(input && input.city, 80),
    state: s(input && input.state, 3).toUpperCase(),
    postcode: s(input && input.postcode, 20),
    country: s(input && input.country, 2).toUpperCase(),
  };
  if (!a.name) return [null, 'Please enter your name.'];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email)) return [null, 'Please enter a valid email address.'];
  if (!/^\+?[\d\s\-./()]{8,20}$/.test(a.phone)) return [null, 'Please enter a phone number; the courier needs one.'];
  if (!a.street1 || !a.city || !a.postcode) return [null, 'Please fill in the street, city and postcode.'];
  if (!/^[A-Z]{2}$/.test(a.country)) return [null, 'Please choose a country.'];
  if (['US', 'CA', 'AU'].includes(a.country) && !a.state) return [null, 'Please choose a state or province.'];
  return [a, null];
};

export const getOrder = (db, id) =>
  db.prepare('SELECT * FROM store_orders WHERE id = ? LIMIT 1').bind(String(id || '').toUpperCase()).first();

export const logEvent = (db, orderId, kind, detail) =>
  db
    .prepare('INSERT INTO store_events (id, order_id, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(uuid(), orderId, kind, detail ? String(detail).slice(0, 2000) : null, now())
    .run();

// Send a paid order to Lulu. A short-lived claim keeps two callers from printing it twice.
export const submitToLulu = async (env, origin, id) => {
  const db = env.DB;
  const t = now();
  const claim = await db
    .prepare(
      `UPDATE store_orders SET lulu_status = 'SUBMITTING', updated_at = ?
       WHERE id = ? AND status = 'paid' AND lulu_job_id IS NULL
         AND (lulu_status IS NULL OR lulu_status != 'SUBMITTING' OR updated_at < ?)`
    )
    .bind(t, id, t - 5 * 60_000)
    .run();
  if (!claim.meta.changes) return getOrder(db, id);

  const order = await getOrder(db, id);
  try {
    const job = await createPrintJob(env, origin, order, JSON.parse(order.items_json), JSON.parse(order.address_json));
    await db
      .prepare(
        `UPDATE store_orders SET status = 'submitted', lulu_job_id = ?, lulu_status = ?, error = NULL,
           updated_at = ?, synced_at = ? WHERE id = ?`
      )
      .bind(job.id, jobProgress(job).lulu_status || 'CREATED', now(), now(), id)
      .run();
    await logEvent(db, id, 'submitted', `Lulu print job ${job.id}`);
  } catch (err) {
    await db
      .prepare('UPDATE store_orders SET lulu_status = NULL, error = ?, updated_at = ? WHERE id = ?')
      .bind(String(err.message).slice(0, 500), now(), id)
      .run();
    await logEvent(db, id, 'error', `Sending to Lulu failed: ${err.message}`);
  }
  return getOrder(db, id);
};

// Called from the customer's return page and from Stripe's webhook, whichever comes first.
export const finalizeOrder = async (env, origin, id, session = null) => {
  const db = env.DB;
  const order = await getOrder(db, id);
  if (!order || order.status !== 'pending' || !order.stripe_session_id) return order;
  const s =
    session && session.id === order.stripe_session_id
      ? session
      : await stripe(env, `/v1/checkout/sessions/${order.stripe_session_id}`, null, 'GET');
  if (s.payment_status !== 'paid') return order;

  const t = now();
  const tax = (s.total_details && s.total_details.amount_tax) || 0;
  const claim = await db
    .prepare(
      `UPDATE store_orders SET status = 'paid', paid_at = ?, updated_at = ?, stripe_payment_intent = ?,
         tax_cents = ?, total_cents = COALESCE(?, total_cents)
       WHERE id = ? AND status = 'pending'`
    )
    .bind(t, t, s.payment_intent || null, tax, s.amount_total == null ? null : s.amount_total, order.id)
    .run();
  if (!claim.meta.changes) return getOrder(db, order.id);
  await logEvent(db, order.id, 'paid', `Stripe ${s.payment_intent || s.id}, ${s.amount_total} cents`);
  return submitToLulu(env, origin, order.id);
};

const FINISHED = ['delivered', 'rejected', 'canceled'];

// Record what Lulu says about the print job (from its webhook or when we ask).
export const applyJob = async (db, order, job) => {
  const p = jobProgress(job);
  const t = now();
  const problem = ['rejected', 'canceled'].includes(p.status) ? p.message || order.error : order.error;
  await db
    .prepare(
      `UPDATE store_orders SET status = ?, lulu_status = ?, tracking_json = ?, error = ?, updated_at = ?,
         synced_at = ?, shipped_at = CASE WHEN ? THEN COALESCE(shipped_at, ?) ELSE shipped_at END
       WHERE id = ?`
    )
    .bind(
      p.status,
      p.lulu_status,
      p.tracking.length ? JSON.stringify(p.tracking) : order.tracking_json,
      problem,
      t,
      t,
      ['shipped', 'delivered'].includes(p.status) ? 1 : 0,
      t,
      order.id
    )
    .run();
  if (p.lulu_status !== order.lulu_status) {
    await logEvent(db, order.id, 'lulu', `${p.lulu_status}${p.message ? `: ${p.message}` : ''}`);
  }
};

export const syncOrder = async (env, order) => {
  if (!order.lulu_job_id || !luluConfigured(env) || FINISHED.includes(order.status)) return order;
  await applyJob(env.DB, order, await getPrintJob(env, order.lulu_job_id));
  return getOrder(env.DB, order.id);
};

export const needsSync = (order) =>
  !!order.lulu_job_id && !FINISHED.includes(order.status) && (!order.synced_at || now() - order.synced_at > 10 * 60_000);

export const STATUS_LABELS = {
  pending: 'Waiting for payment',
  paid: 'Paid. Sending to the printer',
  submitted: 'Preparing to print',
  printing: 'Printing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  rejected: 'There is a problem with this order',
  canceled: 'Canceled',
};

// What the customer may see about their own order.
export const publicOrder = (o) => {
  const address = JSON.parse(o.address_json);
  return {
    id: o.id,
    status: o.status,
    statusLabel: STATUS_LABELS[o.status] || o.status,
    createdAt: o.created_at,
    paidAt: o.paid_at,
    shippedAt: o.shipped_at,
    items: JSON.parse(o.items_json),
    shippingLabel: LEVELS[o.shipping_level] || o.shipping_level,
    subtotalCents: o.subtotal_cents,
    shippingCents: o.shipping_cents,
    taxCents: o.tax_cents || 0,
    totalCents: o.total_cents,
    tracking: o.tracking_json ? JSON.parse(o.tracking_json) : [],
    shipTo: { name: address.name, city: address.city, country: address.country },
  };
};
