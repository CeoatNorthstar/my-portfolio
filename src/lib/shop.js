// The bookstore: where it lives, its API, and the cart.
// On shop.naol.me it sits at the root; anywhere else (naol.me, local dev) under /store.
import { useSyncExternalStore } from 'react';
import { store } from './storage';

export const onShopHost = () => window.location.hostname.startsWith('shop.');
const base = () => (onShopHost() ? '' : '/store');
export const shopPath = (path = '/') => `${base()}${path}`.replace(/(.)\/$/, '$1') || '/';

// Where the main site's "Books" link goes.
export const shopHome = () => {
  const host = window.location.hostname;
  return host === 'naol.me' || host.endsWith('.naol.me') ? 'https://shop.naol.me' : '/store';
};

export const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

// ── API ──
const call = async (path, body) => {
  const res = await fetch(
    path,
    body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

let configRequest = null;
export const getShopConfig = () => {
  if (!configRequest) {
    configRequest = call('/api/store/config').catch((err) => {
      configRequest = null;
      throw err;
    });
  }
  return configRequest;
};
export const getQuote = (cart, address) => call('/api/store/quote', { cart, address });
export const startCheckout = (cart, address, level) => call('/api/store/checkout', { cart, address, level });
export const getOrder = (id, token, sessionId) =>
  call(
    `/api/store/orders/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}${
      sessionId ? `&session_id=${encodeURIComponent(sessionId)}` : ''
    }`
  );
export const lookupOrder = (id, email) => call('/api/store/lookup', { id, email });

// ── Cart: [{ slug, qty }], kept in localStorage and shared across tabs ──
const CART_KEY = 'nd_cart';
const listeners = new Set();
const readCart = () => {
  const saved = store.getJson(CART_KEY, []);
  return Array.isArray(saved) ? saved.filter((i) => i && typeof i.slug === 'string' && i.qty > 0) : [];
};
let cart = readCart();
const emit = () => listeners.forEach((l) => l());
const save = (next) => {
  cart = next;
  store.setJson(CART_KEY, cart);
  emit();
};

window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) {
    cart = readCart();
    emit();
  }
});

export const cartActions = {
  add(slug, qty = 1) {
    const has = cart.some((i) => i.slug === slug);
    save(has ? cart.map((i) => (i.slug === slug ? { ...i, qty: Math.min(10, i.qty + qty) } : i)) : [...cart, { slug, qty }]);
  },
  set(slug, qty) {
    save(qty <= 0 ? cart.filter((i) => i.slug !== slug) : cart.map((i) => (i.slug === slug ? { ...i, qty: Math.min(10, qty) } : i)));
  },
  clear() {
    save([]);
  },
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useCart = () => useSyncExternalStore(subscribe, () => cart);
