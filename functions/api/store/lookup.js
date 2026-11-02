import { error, handle, json } from '../../_lib/response.js';
import { getOrder } from '../../_lib/orders.js';

// POST /api/store/lookup { id, email } — find an order's tracking link again.
export const onRequestPost = handle(async ({ request, env }) => {
  const body = await request.json().catch(() => null);
  const order = await getOrder(env.DB, String((body && body.id) || '').trim());
  const email = String((body && body.email) || '').trim().toLowerCase();
  if (!order || !email || order.email !== email) return error('No order matches that number and email.', 404);
  return json({ id: order.id, token: order.token });
});
