import { error, handle, json } from '../../_lib/response.js';
import { finalizeOrder, publicOrigin } from '../../_lib/orders.js';
import { checkStripeSignature, webhookSecret } from '../../_lib/stripe.js';

// POST /api/store/stripe-webhook — Stripe says a checkout was paid; send the order to Lulu
// even if the customer closed the tab before coming back to the site.
export const onRequestPost = handle(async ({ request, env }) => {
  const raw = await request.text();
  if (!(await checkStripeSignature(await webhookSecret(env), raw, request.headers.get('Stripe-Signature')))) {
    return error('Invalid signature', 400);
  }
  const event = JSON.parse(raw);
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    const s = event.data.object;
    const id = s.client_reference_id || (s.metadata && s.metadata.order_id);
    if (id) await finalizeOrder(env, publicOrigin(env, request), id, s);
  }
  return json({ received: true });
});
