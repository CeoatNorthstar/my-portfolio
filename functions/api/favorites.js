import { json } from '../_lib/response.js';
import { LIST_POSTS_SQL } from '../_lib/db.js';
import { clientIdFrom } from '../_lib/util.js';

// GET /api/favorites?cid= — posts this visitor has saved.
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const clientId = clientIdFrom(request, url.searchParams.get('cid'));
  const { results } = await env.DB.prepare(
    `${LIST_POSTS_SQL} AND p.id IN (SELECT post_id FROM favorites WHERE client_id = ?) ORDER BY p.published_at DESC LIMIT 100`
  )
    .bind(clientId)
    .all();
  return json({ posts: results });
};
