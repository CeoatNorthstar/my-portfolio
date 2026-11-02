import { handle, json, notFound } from '../../../_lib/response.js';
import { timingSafeEqual } from '../../../_lib/lulu.js';
import { finalizeOrder, getOrder, needsSync, publicOrder, publicOrigin, syncOrder } from '../../../_lib/orders.js';

// GET /api/store/orders/:id?t=<token>[&session_id=] — the customer's view of their order.
// Coming back from Stripe confirms the payment; later visits refresh Lulu's progress.
export const onRequestGet = handle(async ({ request, params, env }) => {
  const url = new URL(request.url);
  let order = await getOrder(env.DB, params.id);
  if (!order || !timingSafeEqual(order.token, url.searchParams.get('t') || '')) return notFound('Order not found');

  const sessionId = url.searchParams.get('session_id');
  if (order.status === 'pending' && sessionId && sessionId === order.stripe_session_id) {
    order = await finalizeOrder(env, publicOrigin(env, request), order.id);
  } else if (needsSync(order)) {
    order = await syncOrder(env, order).catch(() => order);
  }
  return json({ order: publicOrder(order) });
});
