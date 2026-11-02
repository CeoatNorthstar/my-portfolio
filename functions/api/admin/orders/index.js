import { handle, json } from '../../../_lib/response.js';
import { luluConfigured, luluSandbox } from '../../../_lib/lulu.js';
import { storeOpen } from '../../../_lib/orders.js';
import { stripeKey, stripeTaxActive, stripeTestMode, webhookSecret } from '../../../_lib/stripe.js';

// GET /api/admin/orders — recent orders, plus whether the store is set up.
export const onRequestGet = handle(async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT * FROM store_orders ORDER BY created_at DESC LIMIT 200').all();
  return json({
    setup: {
      open: storeOpen(env),
      enabled: env.STORE_ENABLED !== 'false',
      lulu: luluConfigured(env),
      luluSandbox: luluSandbox(env),
      stripe: !!stripeKey(env),
      stripeTest: stripeTestMode(env),
      stripeWebhook: !!(await webhookSecret(env)),
      stripeTax: !!stripeKey(env) && (await stripeTaxActive(env)),
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
