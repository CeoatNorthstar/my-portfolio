import { json, notFound } from '../../../_lib/response.js';
import { resolvePost } from '../../../_lib/db.js';
import { uuid, now, clientIdFrom } from '../../../_lib/util.js';

// POST /api/posts/:id/favorite — toggle favorite (saved) for this visitor.
export const onRequestPost = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const body = await request.json().catch(() => ({}));
  const clientId = clientIdFrom(request, body.clientId);

  const existing = await env.DB.prepare(
    'SELECT id FROM favorites WHERE post_id = ? AND client_id = ? LIMIT 1'
  )
    .bind(post.id, clientId)
    .first();

  let favorited;
  if (existing) {
    await env.DB.prepare('DELETE FROM favorites WHERE id = ?').bind(existing.id).run();
    favorited = false;
  } else {
    await env.DB.prepare(
      'INSERT INTO favorites (id, post_id, client_id, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(uuid(), post.id, clientId, now())
      .run();
    favorited = true;
  }

  return json({ favorited });
};
