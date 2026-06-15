import { json, error, notFound } from '../../../_lib/response.js';
import { resolvePost } from '../../../_lib/db.js';
import { verifyTurnstile } from '../../../_lib/turnstile.js';
import { uuid, now } from '../../../_lib/util.js';

// GET /api/posts/:id/comments — approved comments, oldest first.
export const onRequestGet = async ({ params, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');
  const { results } = await env.DB.prepare(
    'SELECT id, author_name, body, created_at FROM comments WHERE post_id = ? AND approved = 1 ORDER BY created_at ASC'
  )
    .bind(post.id)
    .all();
  return json({ comments: results });
};

// POST /api/posts/:id/comments — submit a comment (Turnstile-gated, unapproved).
export const onRequestPost = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const body = await request.json().catch(() => ({}));
  const name = String(body.author_name || '').trim().slice(0, 60);
  const text = String(body.body || '').trim().slice(0, 2000);
  if (!name || !text) return error('Name and comment are required');

  const ok = await verifyTurnstile(body.turnstileToken, request, env);
  if (!ok) return error('Verification failed', 403);

  await env.DB.prepare(
    'INSERT INTO comments (id, post_id, author_name, body, approved, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  )
    .bind(uuid(), post.id, name, text, now())
    .run();

  return json({ ok: true, pending: true });
};
