import { verifyAccess } from '../../_lib/access.js';
import { unauthorized } from '../../_lib/response.js';

// Defense-in-depth: every /api/admin/* request re-verifies the Cloudflare
// Access JWT, even though Access also gates these routes at the edge.
export const onRequest = async (context) => {
  const identity = await verifyAccess(context.request, context.env);
  if (!identity) return unauthorized('Cloudflare Access authentication required');
  context.data.identity = identity;
  return context.next();
};
