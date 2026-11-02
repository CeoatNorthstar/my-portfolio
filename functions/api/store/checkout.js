import { error, handle, json } from '../../_lib/response.js';
import { cartItems } from '../../_lib/catalog.js';
import { LEVELS, LuluError, quoteFor } from '../../_lib/lulu.js';
import { cleanAddress, logEvent, newOrderId, newToken, storeOpen } from '../../_lib/orders.js';
import { TAX_CODES, stripe, stripeTaxActive } from '../../_lib/stripe.js';
import { now } from '../../_lib/util.js';

// POST /api/store/checkout { cart, address, level, optIn } — price the order again on the server,
// save it, and open a Stripe Embedded Checkout for it. Once Stripe Tax is set up, Stripe adds
// sales tax for the shipping address.
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

  const tax = await stripeTaxActive(env);
  const where = {
    line1: address.street1,
    line2: address.street2 || undefined,
    city: address.city,
    state: address.state || undefined,
    postal_code: address.postcode,
    country: address.country,
  };
  const price = (cents, name, taxCode, image) => ({
    currency: 'usd',
    unit_amount: cents,
    tax_behavior: 'exclusive',
    product_data: { name, tax_code: taxCode, images: image ? [image] : undefined },
  });

  let session;
  try {
    // The customer carries the shipping address, which is what Stripe Tax goes by.
    const customer = await stripe(env, '/v1/customers', {
      email: address.email,
      name: address.name,
      phone: address.phone,
      address: where,
      shipping: { name: address.name, phone: address.phone, address: where },
      metadata: { order_id: id },
    });
    session = await stripe(env, '/v1/checkout/sessions', {
      ui_mode: 'embedded_page',
      mode: 'payment',
      customer: customer.id,
      automatic_tax: { enabled: tax },
      allow_promotion_codes: true,
      client_reference_id: id,
      metadata: { order_id: id },
      // Stripe emails its own receipt, with the order number in the description.
      payment_intent_data: { description: `naol.me order ${id}`, metadata: { order_id: id }, receipt_email: address.email },
      line_items: [
        ...items.map((i) => ({
          quantity: i.qty,
          price_data: price(i.unit_cents, `${i.title} (paperback)`, TAX_CODES.book, `${env.SITE_URL || origin}/store/${i.slug}/front.jpg`),
        })),
        { quantity: 1, price_data: price(quote.shippingCents, `Shipping: ${quote.label}`, TAX_CODES.shipping) },
      ],
      return_url: `${origin}${back}/order/${id}?t=${token}&session_id={CHECKOUT_SESSION_ID}`,
    });
  } catch (err) {
    console.error('Stripe checkout failed:', err.message);
    return error(
      /address|postal|zip/i.test(err.message)
        ? 'Stripe could not use that address for tax. Please check the postcode and state.'
        : 'Payment could not be started. Please try again in a moment.',
      422 // not a 5xx: Cloudflare replaces those with its own error page
    );
  }

  const t = now();
  await env.DB.prepare(
    `INSERT INTO store_orders (id, token, status, email, name, address_json, items_json, shipping_level,
       subtotal_cents, shipping_cents, total_cents, lulu_cost_cents, stripe_session_id, marketing_opt_in,
       created_at, updated_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, token, address.email, address.name, JSON.stringify(address), JSON.stringify(items), level, subtotal,
      quote.shippingCents, total, quote.luluCents, session.id, body && body.optIn ? 1 : 0, t, t)
    .run();
  await logEvent(env.DB, id, 'created', `${items.map((i) => `${i.qty} x ${i.slug}`).join(', ')}; ${level}; ${total} cents`);

  return json({ clientSecret: session.client_secret, orderId: id });
});
