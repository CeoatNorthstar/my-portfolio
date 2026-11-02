// Lulu Print API: sign-in, shipping quotes, print jobs and webhook checks.
// Docs: https://api.lulu.com/docs/ (sandbox: https://api.sandbox.lulu.com).
import { POD_PACKAGE, bookBySlug, printKey } from './catalog.js';

export const LEVELS = {
  MAIL: 'Standard mail',
  PRIORITY_MAIL: 'Priority mail',
  GROUND_HD: 'Ground courier',
  GROUND_BUS: 'Ground courier (business address)',
  GROUND: 'Ground courier',
  EXPEDITED: 'Expedited (2-day air)',
  EXPRESS: 'Express (overnight)',
};

export class LuluError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

// Lulu's API sits behind a firewall that turns away requests without a User-Agent.
const USER_AGENT = 'naol.me-bookstore/1.0 (+https://shop.naol.me)';

export const luluBase = (env) => (env.LULU_API_BASE || 'https://api.lulu.com').replace(/\/+$/, '');
export const luluSandbox = (env) => luluBase(env).includes('sandbox');
export const luluConfigured = (env) => !!(env.LULU_CLIENT_KEY && env.LULU_CLIENT_SECRET);

// The first readable message in Lulu's (nested) validation errors.
const firstMessage = (data) => {
  if (!data || typeof data !== 'object') return typeof data === 'string' ? data : '';
  if (typeof data.message === 'string') return data.message;
  if (typeof data.detail === 'string') return data.detail;
  for (const value of Object.values(data)) {
    const found = Array.isArray(value) ? value.map(firstMessage).find(Boolean) : firstMessage(value);
    if (found) return found;
  }
  return '';
};

let session = null; // { token, base, expires } — reused while this isolate lives

const accessToken = async (env) => {
  const base = luluBase(env);
  if (session && session.base === base && session.expires > Date.now() + 60_000) return session.token;
  const res = await fetch(`${base}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${env.LULU_CLIENT_KEY}:${env.LULU_CLIENT_SECRET}`)}`,
      'User-Agent': USER_AGENT,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) throw new LuluError('Could not sign in to Lulu', res.status, data);
  session = { token: data.access_token, base, expires: Date.now() + (data.expires_in || 3600) * 1000 };
  return session.token;
};

export const lulu = async (env, path, { method = 'GET', body } = {}) => {
  const res = await fetch(`${luluBase(env)}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken(env)}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'User-Agent': USER_AGENT,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new LuluError(firstMessage(data) || `Lulu request failed (${res.status})`, res.status, data);
  return data;
};

export const toCents = (amount) => Math.round(parseFloat(amount || '0') * 100);

// Our address shape -> the two shapes Lulu uses (cost/print jobs vs shipping options).
const jobAddress = (a) => ({
  name: a.name,
  street1: a.street1,
  street2: a.street2 || '',
  city: a.city,
  state_code: a.state || '',
  postcode: a.postcode,
  country_code: a.country,
  phone_number: a.phone,
});

const optionsAddress = (a) => ({
  name: a.name,
  street1: a.street1,
  street2: a.street2 || '',
  city: a.city,
  state: a.state || '',
  postcode: a.postcode,
  country: a.country,
  phone_number: a.phone,
});

const lineItems = (items) =>
  items.map((i) => ({ page_count: bookBySlug(i.slug).pages, pod_package_id: POD_PACKAGE, quantity: i.qty }));

const costFor = (env, items, address, level) =>
  lulu(env, '/print-job-cost-calculations/', {
    method: 'POST',
    body: { line_items: lineItems(items), shipping_address: jobAddress(address), shipping_option: level },
  });

const quoteFrom = (level, cost, option) => ({
  level,
  label: LEVELS[level],
  shippingCents: toCents(cost.shipping_cost && cost.shipping_cost.total_cost_incl_tax),
  luluCents: toCents(cost.total_cost_incl_tax),
  minDelivery: (option && option.min_delivery_date) || null,
  maxDelivery: (option && option.max_delivery_date) || null,
});

// Every way Lulu can ship these books to this address, cheapest first.
export const shippingQuotes = async (env, items, address) => {
  const options = await lulu(env, '/shipping-options/', {
    method: 'POST',
    body: { currency: 'USD', line_items: lineItems(items), shipping_address: optionsAddress(address) },
  }).catch(() => []);
  const byLevel = {};
  // Keep Lulu's exact levels: for US ground it offers GROUND_HD (home) or GROUND_BUS, not GROUND.
  for (const o of Array.isArray(options) ? options : options.results || []) {
    if (LEVELS[o.level] && !byLevel[o.level]) byLevel[o.level] = o;
  }
  const levels = Object.keys(byLevel).length ? Object.keys(byLevel) : ['MAIL', 'PRIORITY_MAIL', 'EXPEDITED', 'EXPRESS'];
  const costs = await Promise.allSettled(levels.map((level) => costFor(env, items, address, level)));
  const quotes = costs
    .map((r, i) => (r.status === 'fulfilled' ? quoteFrom(levels[i], r.value, byLevel[levels[i]]) : null))
    .filter(Boolean)
    .sort((a, b) => a.shippingCents - b.shippingCents);
  if (!quotes.length) {
    const failed = costs.find((r) => r.status === 'rejected');
    throw failed ? failed.reason : new LuluError('Lulu cannot ship to this address', 422);
  }
  return quotes;
};

export const quoteFor = async (env, items, address, level) => quoteFrom(level, await costFor(env, items, address, level));

// ── Print files: Lulu downloads them through links that expire ──

const hmacHex = async (secret, message) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const fileSecret = (env) => env.PRINT_FILES_SECRET || env.LULU_CLIENT_SECRET || '';

export const signedFileUrl = async (env, origin, key, days = 30) => {
  const expires = Date.now() + days * 86_400_000;
  const sig = await hmacHex(fileSecret(env), `${key}:${expires}`);
  return `${origin}/api/store/print-file?k=${encodeURIComponent(key)}&e=${expires}&s=${sig}`;
};

export const checkFileSignature = async (env, key, expires, sig) => {
  if (!fileSecret(env) || !key || !key.startsWith('print/') || !(Number(expires) > Date.now())) return false;
  return timingSafeEqual(await hmacHex(fileSecret(env), `${key}:${expires}`), String(sig || ''));
};

export const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

// Lulu signs each webhook with our API secret: HMAC-SHA256 over the raw body.
export const checkWebhookSignature = async (env, rawBody, header) => {
  if (!header || !env.LULU_CLIENT_SECRET) return false;
  const hex = await hmacHex(env.LULU_CLIENT_SECRET, rawBody);
  const b64 = btoa(String.fromCharCode(...hex.match(/../g).map((h) => parseInt(h, 16))));
  const given = header.trim();
  return timingSafeEqual(hex, given.toLowerCase()) || timingSafeEqual(b64, given);
};

// ── Print jobs ──

export const createPrintJob = async (env, origin, order, items, address) => {
  const lines = await Promise.all(
    items.map(async (i) => ({
      external_id: `${order.id}-${i.slug}`,
      title: bookBySlug(i.slug).title,
      quantity: i.qty,
      printable_normalization: {
        pod_package_id: POD_PACKAGE,
        interior: { source_url: await signedFileUrl(env, origin, printKey(i.slug, 'interior')) },
        cover: { source_url: await signedFileUrl(env, origin, printKey(i.slug, 'cover')) },
      },
    }))
  );
  return lulu(env, '/print-jobs/', {
    method: 'POST',
    body: {
      external_id: order.id,
      contact_email: env.STORE_CONTACT_EMAIL || env.CONTACT_TO_EMAIL,
      shipping_level: order.shipping_level,
      production_delay: 60,
      shipping_address: jobAddress(address),
      line_items: lines,
    },
  });
};

export const getPrintJob = (env, id) => lulu(env, `/print-jobs/${id}/`);

// A Lulu print job, read as our order status plus any tracking.
export const jobProgress = (job) => {
  const name = (job && job.status && job.status.name) || '';
  const status =
    {
      IN_PRODUCTION: 'printing',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      REJECTED: 'rejected',
      CANCELED: 'canceled',
    }[name] || 'submitted';
  const tracking = [];
  for (const line of (job && job.line_items) || []) {
    const m = (line.status && line.status.messages) || {};
    if (m.tracking_id || (m.tracking_urls && m.tracking_urls.length)) {
      tracking.push({ carrier: m.carrier_name || '', id: m.tracking_id || '', urls: m.tracking_urls || [] });
    }
  }
  const message = (job && job.status && job.status.message) || '';
  return { lulu_status: name, status, tracking, message };
};
