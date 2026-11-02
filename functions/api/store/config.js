import { json } from '../../_lib/response.js';
import { BOOKS } from '../../_lib/catalog.js';
import { luluSandbox } from '../../_lib/lulu.js';
import { storeOpen } from '../../_lib/orders.js';
import { stripePublishableKey, stripeTaxActive } from '../../_lib/stripe.js';

// GET /api/store/config — the catalog, whether orders are open (and in test mode), and
// whether Stripe adds sales tax at payment.
export const onRequestGet = async ({ env }) => {
  const open = storeOpen(env);
  return json({
    open,
    test: open && luluSandbox(env),
    tax: open && (await stripeTaxActive(env)),
    stripePublishableKey: open ? stripePublishableKey(env) : '',
    books: BOOKS,
  });
};
