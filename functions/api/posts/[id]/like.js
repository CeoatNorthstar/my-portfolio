import { json, notFound } from '../../../_lib/response.js';
import { resolvePost } from '../../../_lib/db.js';
import { uuid, now, clientIdFrom } from '../../../_lib/util.js';

// POST /api/posts/:id/like — toggle a like for this visitor.
export const onRequestPost = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const body = await request.json().catch(() => ({}));
  const clientId = clientIdFrom(request, body.clientId);

  const existing = await env.DB.prepare(
    'SELECT id FROM likes WHERE post_id = ? AND client_id = ? LIMIT 1'
  )
    .bind(post.id, clientId)
    .first();

  let liked;
  if (existing) {
    await env.DB.prepare('DELETE FROM likes WHERE id = ?').bind(existing.id).run();
    liked = false;
  } else {
    await env.DB.prepare(
      'INSERT INTO likes (id, post_id, client_id, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(uuid(), post.id, clientId, now())
      .run();
    liked = true;
  }

  const count = await env.DB.prepare('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?')
    .bind(post.id)
    .first();
  return json({ liked, likes: count?.c || 0 });
};
