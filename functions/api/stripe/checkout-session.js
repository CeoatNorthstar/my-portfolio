import { json, error } from '../../_lib/response.js';

// POST /api/stripe/checkout-session — create an Embedded Checkout session and
// return its client_secret. Stripe is called via REST (no Node SDK in Workers).
export const onRequestPost = async ({ request, env }) => {
  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) return error('Stripe is not configured', 500);

  const amount = Number(env.DONATION_AMOUNT_CENTS || 1000);
  const origin = env.SITE_URL || new URL(request.url).origin;

  const form = new URLSearchParams();
  form.append('ui_mode', 'embedded');
  form.append('mode', 'payment');
  form.append('line_items[0][quantity]', '1');
  form.append('line_items[0][price_data][currency]', 'usd');
  form.append('line_items[0][price_data][unit_amount]', String(amount));
  // Use the configured product if set, otherwise create an inline one.
  if (env.STRIPE_PRODUCT_ID) {
    form.append('line_items[0][price_data][product]', env.STRIPE_PRODUCT_ID);
  } else {
    form.append('line_items[0][price_data][product_data][name]', 'Support Sentinel Collective');
    form.append(
      'line_items[0][price_data][product_data][description]',
      'A contribution toward research, compute, and open-source work.'
    );
  }
  form.append('return_url', `${origin}/success?session_id={CHECKOUT_SESSION_ID}`);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Stripe error:', data);
    return error(data.error?.message || 'Stripe request failed', 502);
  }

  return json({ clientSecret: data.client_secret });
};
