import { error, handle, json } from '../../_lib/response.js';
import { lulu, luluConfigured } from '../../_lib/lulu.js';
import { publicOrigin } from '../../_lib/orders.js';

// POST /api/admin/store { action: 'connect-lulu-webhook' } — ask Lulu to report every print
// job's status changes to this site (once; it is reused after that).
export const onRequestPost = handle(async ({ request, env }) => {
  const { action } = (await request.json().catch(() => ({}))) || {};
  if (action !== 'connect-lulu-webhook') return error('Unknown action');
  if (!luluConfigured(env)) return error('Add the Lulu API keys first.', 503);
  const url = `${publicOrigin(env, request)}/api/store/lulu-webhook`;
  const existing = await lulu(env, '/webhooks/');
  const list = Array.isArray(existing) ? existing : existing.results || [];
  const found = list.find((w) => w.url === url);
  if (found && found.is_active) return json({ webhook: found, created: false });
  const webhook = found
    ? await lulu(env, `/webhooks/${found.id}/`, { method: 'PATCH', body: { is_active: true, topics: ['PRINT_JOB_STATUS_CHANGED'] } })
    : await lulu(env, '/webhooks/', { method: 'POST', body: { url, topics: ['PRINT_JOB_STATUS_CHANGED'] } });
  return json({ webhook, created: !found });
});
