import { handle, json } from '../../../_lib/response.js';
import { luluConfigured, luluSandbox } from '../../../_lib/lulu.js';
import { storeOpen } from '../../../_lib/orders.js';
import { stripeTestMode } from '../../../_lib/stripe.js';

// GET /api/admin/orders — recent orders, plus whether the store is set up.
export const onRequestGet = handle(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM store_orders ORDER BY created_at DESC LIMIT 200').all();
  return json({
    setup: {
      open: storeOpen(env),
      lulu: luluConfigured(env),
      luluSandbox: luluSandbox(env),
      stripe: !!env.STRIPE_SECRET_KEY,
      stripeTest: stripeTestMode(env),
      stripeWebhook: !!env.STRIPE_WEBHOOK_SECRET,
    },
    orders: (results || []).map((o) => ({
      ...o,
      address: JSON.parse(o.address_json),
      items: JSON.parse(o.items_json),
      tracking: o.tracking_json ? JSON.parse(o.tracking_json) : [],
      address_json: undefined,
      items_json: undefined,
      tracking_json: undefined,
      token: undefined,
    })),
  });
});
