import { error, handle, json } from '../../_lib/response.js';
import { cartItems } from '../../_lib/catalog.js';
import { LuluError, shippingQuotes } from '../../_lib/lulu.js';
import { cleanAddress, storeOpen } from '../../_lib/orders.js';

// POST /api/store/quote { cart, address } — Lulu's shipping options and prices for this address.
export const onRequestPost = handle(async ({ request, env }) => {
  if (!storeOpen(env)) return error('Orders are not open yet', 503);
  const body = await request.json().catch(() => null);
  const items = cartItems(body && body.cart);
  if (!items) return error('Your cart is empty.');
  const [address, problem] = cleanAddress(body && body.address);
  if (!address) return error(problem);
  try {
    const quotes = await shippingQuotes(env, items, address);
    return json({
      subtotalCents: items.reduce((sum, i) => sum + i.qty * i.unit_cents, 0),
      quotes: quotes.map(({ luluCents, ...q }) => q),
    });
  } catch (err) {
    console.error('Lulu quote failed:', err.message, JSON.stringify(err.detail || {}));
    return error(err instanceof LuluError ? err.message : 'Could not get shipping prices. Please try again.', 422);
  }
});
