import { error, handle, json, notFound } from '../../../_lib/response.js';
import { getOrder, logEvent, publicOrigin, submitToLulu, syncOrder } from '../../../_lib/orders.js';

// GET /api/admin/orders/:id — one order with its history.
export const onRequestGet = handle(async ({ params, env }) => {
  const order = await getOrder(env.DB, params.id);
  if (!order) return notFound('Order not found');
  const { results } = await env.DB.prepare('SELECT * FROM store_events WHERE order_id = ? ORDER BY created_at')
    .bind(order.id)
    .all();
  return json({ order, events: results || [] });
});

// POST /api/admin/orders/:id { action: 'submit' | 'sync' } — retry sending a paid order to
// Lulu, or ask Lulu for its latest status.
export const onRequestPost = handle(async ({ request, params, env, data }) => {
  const order = await getOrder(env.DB, params.id);
  if (!order) return notFound('Order not found');
  const { action } = (await request.json().catch(() => ({}))) || {};
  const who = (data.identity && data.identity.email) || 'admin';
  if (action === 'submit') {
    if (order.status !== 'paid' || order.lulu_job_id) return error('Only a paid order that is not at Lulu yet can be sent.');
    await logEvent(env.DB, order.id, 'admin', `${who} retried sending to Lulu`);
    return json({ order: await submitToLulu(env, publicOrigin(env, request), order.id) });
  }
  if (action === 'sync') return json({ order: await syncOrder(env, order) });
  return error('Unknown action');
});
