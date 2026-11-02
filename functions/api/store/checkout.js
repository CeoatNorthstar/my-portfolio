import { error, handle, json } from '../../_lib/response.js';
import { cartItems } from '../../_lib/catalog.js';
import { LEVELS, LuluError, quoteFor } from '../../_lib/lulu.js';
import { cleanAddress, logEvent, newOrderId, newToken, storeOpen } from '../../_lib/orders.js';
import { stripe } from '../../_lib/stripe.js';
import { now } from '../../_lib/util.js';

// POST /api/store/checkout { cart, address, level } — price the order again on the server,
// save it, and open a Stripe Embedded Checkout for it.
export const onRequestPost = handle(async ({ request, env }) => {
  if (!storeOpen(env)) return error('Orders are not open yet', 503);
  const body = await request.json().catch(() => null);
  const items = cartItems(body && body.cart);
  if (!items) return error('Your cart is empty.');
  const [address, problem] = cleanAddress(body && body.address);
  if (!address) return error(problem);
  const level = String((body && body.level) || '');
  if (!LEVELS[level]) return error('Please choose a shipping option.');

  let quote;
  try {
    quote = await quoteFor(env, items, address, level);
  } catch (err) {
    return error(err instanceof LuluError ? err.message : 'Could not price shipping. Please try again.', 422);
  }

  const id = newOrderId();
  const token = newToken();
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.unit_cents, 0);
  const total = subtotal + quote.shippingCents;
  const origin = new URL(request.url).origin;
  const back = new URL(request.url).hostname.startsWith('shop.') ? '' : '/store';

  let session;
  try {
    session = await stripe(env, '/v1/checkout/sessions', {
      ui_mode: 'embedded',
      mode: 'payment',
      customer_email: address.email,
      client_reference_id: id,
      metadata: { order_id: id },
      payment_intent_data: { description: `naol.me order ${id}`, metadata: { order_id: id } },
      line_items: [
        ...items.map((i) => ({
          quantity: i.qty,
          price_data: {
            currency: 'usd',
            unit_amount: i.unit_cents,
            product_data: { name: `${i.title} (paperback)`, images: [`${env.SITE_URL || origin}/store/${i.slug}/front.jpg`] },
          },
        })),
        {
          quantity: 1,
          price_data: { currency: 'usd', unit_amount: quote.shippingCents, product_data: { name: `Shipping: ${quote.label}` } },
        },
      ],
      return_url: `${origin}${back}/order/${id}?t=${token}&session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (err) {
    console.error('Stripe checkout failed:', err.message);
    return error('Payment could not be started. Please try again in a moment.', 502);
  }

  const t = now();
  await env.DB.prepare(
    `INSERT INTO store_orders (id, token, status, email, name, address_json, items_json, shipping_level,
       subtotal_cents, shipping_cents, total_cents, lulu_cost_cents, stripe_session_id, created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, token, address.email, address.name, JSON.stringify(address), JSON.stringify(items), level, subtotal,
      quote.shippingCents, total, quote.luluCents, session.id, t, t)
    .run();
  await logEvent(env.DB, id, 'created', `${items.map((i) => `${i.qty} x ${i.slug}`).join(', ')}; ${level}; ${total} cents`);

  return json({ clientSecret: session.client_secret, orderId: id });
});
