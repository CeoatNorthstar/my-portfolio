// Stripe over REST (there is no Node SDK in Workers): form-encoded calls and webhook checks.
import { timingSafeEqual } from './lulu.js';

// { a: { b: [1, 2] } } -> a[b][0]=1&a[b][1]=2, the way Stripe expects nested params.
const encode = (value, prefix, out) => {
  if (value === undefined || value === null) return out;
  if (Array.isArray(value)) value.forEach((v, i) => encode(v, `${prefix}[${i}]`, out));
  else if (typeof value === 'object') Object.entries(value).forEach(([k, v]) => encode(v, prefix ? `${prefix}[${k}]` : k, out));
  else out.append(prefix, String(value));
  return out;
};

export const stripeTestMode = (env) => /^(sk|rk)_test_/.test(env.STRIPE_SECRET_KEY || '');

export const stripe = async (env, path, params, method = 'POST') => {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : encode(params || {}, '', new URLSearchParams()).toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || `Stripe request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

// Stripe-Signature: t=<unix>,v1=<hex hmac of "t.body">, signed with the endpoint's secret.
export const checkStripeSignature = async (secret, rawBody, header, toleranceSec = 300) => {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')).filter((p) => p.length === 2));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return header
    .split(',')
    .filter((kv) => kv.startsWith('v1='))
    .some((kv) => timingSafeEqual(hex, kv.slice(3)));
};
