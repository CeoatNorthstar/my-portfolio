import { json } from '../../_lib/response.js';
import { BOOKS } from '../../_lib/catalog.js';
import { luluSandbox } from '../../_lib/lulu.js';
import { storeOpen } from '../../_lib/orders.js';

// GET /api/store/config — the catalog, and whether orders are open (and in test mode).
export const onRequestGet = ({ env }) => {
  const open = storeOpen(env);
  return json({
    open,
    test: open && luluSandbox(env),
    stripePublishableKey: open ? env.STRIPE_PUBLISHABLE_KEY : '',
    books: BOOKS,
  });
};
