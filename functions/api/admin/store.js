import { error, handle, json } from '../../_lib/response.js';
import { lulu, luluConfigured } from '../../_lib/lulu.js';
import { publicOrigin } from '../../_lib/orders.js';
import { stripe, stripeKey } from '../../_lib/stripe.js';
import { now } from '../../_lib/util.js';

const STRIPE_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

// Ask Lulu to report every print job's status changes to this site (once; reused after that).
const connectLulu = async (env, url) => {
  if (!luluConfigured(env)) return error('Add the Lulu API keys first.', 503);
  const existing = await lulu(env, '/webhooks/');
  const found = (Array.isArray(existing) ? existing : existing.results || []).find((w) => w.url === url);
  if (found && found.is_active) return json({ webhook: { id: found.id, url }, created: false });
  const webhook = found
    ? await lulu(env, `/webhooks/${found.id}/`, { method: 'PATCH', body: { is_active: true, topics: ['PRINT_JOB_STATUS_CHANGED'] } })
    : await lulu(env, '/webhooks/', { method: 'POST', body: { url, topics: ['PRINT_JOB_STATUS_CHANGED'] } });
  return json({ webhook: { id: webhook.id, url }, created: !found });
};

// Ask Stripe to tell this site about paid checkouts. Stripe shows a webhook's signing secret
// only when it is created, so an existing one without a saved secret is replaced.
const connectStripe = async (env, url) => {
  if (!stripeKey(env)) return error('Add the Stripe keys first.', 503);
  const saved = await env.DB.prepare("SELECT value FROM store_settings WHERE key = 'stripe_webhook_secret'").first();
  const { data } = await stripe(env, '/v1/webhook_endpoints?limit=100', null, 'GET');
  const found = (data || []).find((w) => w.url === url);
  if (found && saved) return json({ webhook: { id: found.id, url }, created: false });
  if (found) await stripe(env, `/v1/webhook_endpoints/${found.id}`, null, 'DELETE');
  const endpoint = await stripe(env, '/v1/webhook_endpoints', {
    url,
    enabled_events: STRIPE_EVENTS,
    description: 'naol.me bookstore: send paid orders to the printer',
  });
  await env.DB.prepare(
    `INSERT INTO store_settings (key, value, updated_at) VALUES ('stripe_webhook_secret', ?, ?)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  )
    .bind(endpoint.secret, now())
    .run();
  return json({ webhook: { id: endpoint.id, url }, created: true });
};

// POST /api/admin/store { action: 'connect-lulu-webhook' | 'connect-stripe-webhook' }
export const onRequestPost = handle(async ({ request, env }) => {
  const { action } = (await request.json().catch(() => ({}))) || {};
  const origin = publicOrigin(env, request);
  if (action === 'connect-lulu-webhook') return connectLulu(env, `${origin}/api/store/lulu-webhook`);
  if (action === 'connect-stripe-webhook') return connectStripe(env, `${origin}/api/store/stripe-webhook`);
  return error('Unknown action');
});
