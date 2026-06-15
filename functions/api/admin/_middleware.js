import { verifyAdmin } from '../../_lib/access.js';
import { unauthorized } from '../../_lib/response.js';

// Defense-in-depth: every /api/admin/* request verifies a Cloudflare Access JWT
// or the secret admin token, even if Access also gates these routes at the edge.
export const onRequest = async (context) => {
  const identity = await verifyAdmin(context.request, context.env);
  if (!identity) return unauthorized('Admin authentication required');
  context.data.identity = identity;
  return context.next();
};
