import { json, notFound } from '../../_lib/response.js';
import { resolvePost, withCounts } from '../../_lib/db.js';
import { clientIdFrom } from '../../_lib/util.js';

// GET /api/posts/:idOrSlug — single published post with counts + viewer state.
export const onRequestGet = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const url = new URL(request.url);
  const clientId = clientIdFrom(request, url.searchParams.get('cid'));
  const full = await withCounts(env.DB, post, clientId);
  return json({ post: full });
};
