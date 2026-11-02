import { error, handle, json } from '../../_lib/response.js';
import { checkWebhookSignature } from '../../_lib/lulu.js';
import { applyJob, getOrder } from '../../_lib/orders.js';

// POST /api/store/lulu-webhook — Lulu reports a print job's new status (printing, shipped, …).
export const onRequestPost = handle(async ({ request, env }) => {
  const raw = await request.text();
  if (!(await checkWebhookSignature(env, raw, request.headers.get('Lulu-HMAC-SHA256')))) {
    return error('Invalid signature', 401);
  }
  const { topic, data } = JSON.parse(raw);
  if (topic === 'PRINT_JOB_STATUS_CHANGED' && data) {
    const order =
      (data.external_id && (await getOrder(env.DB, data.external_id))) ||
      (await env.DB.prepare('SELECT * FROM store_orders WHERE lulu_job_id = ? LIMIT 1').bind(data.id).first());
    if (order) await applyJob(env.DB, order, data);
  }
  return json({ received: true });
});
