import { json, error, notFound } from '../../../_lib/response.js';
import { resolvePost } from '../../../_lib/db.js';
import { uuid, now, clamp, clientIdFrom, ipHash, anonymousAlias } from '../../../_lib/util.js';

// GET /api/posts/:id/comments?before=<ts>&limit=10 — newest first, one page at
// a time. Older comments stay archived server-side until a reader asks for them.
export const onRequestGet = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const url = new URL(request.url);
  const limit = clamp(parseInt(url.searchParams.get('limit'), 10) || 10, 1, 50);
  const before = parseInt(url.searchParams.get('before'), 10) || Number.MAX_SAFE_INTEGER;

  const { results } = await env.DB.prepare(
    'SELECT id, author_name, body, created_at FROM comments WHERE post_id = ? AND approved = 1 AND created_at < ? ORDER BY created_at DESC LIMIT ?'
  )
    .bind(post.id, before, limit + 1)
    .all();
  const total = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM comments WHERE post_id = ? AND approved = 1'
  )
    .bind(post.id)
    .first();

  return json({
    comments: results.slice(0, limit),
    hasMore: results.length > limit,
    total: total?.c || 0,
  });
};

// POST /api/posts/:id/comments — anonymous comment, no account needed.
// Spam guard: honeypot field + per-IP rate limit.
export const onRequestPost = async ({ params, request, env }) => {
  const post = await resolvePost(env.DB, params.id, { publishedOnly: true });
  if (!post) return notFound('Post not found');

  const body = await request.json().catch(() => ({}));
  if (body.website) return json({ ok: true }); // bots fill hidden fields

  const text = String(body.body || '').trim().slice(0, 2000);
  if (text.length < 2) return error('Write a little more first.');

  const clientId = clientIdFrom(request, body.clientId);
  const name = String(body.author_name || '').trim().slice(0, 40) || anonymousAlias(clientId);

  const hash = await ipHash(request);
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM comments WHERE ip_hash = ? AND created_at > ?'
  )
    .bind(hash, now() - 60_000)
    .first();
  if ((recent?.c || 0) >= 3) return error('Slow down a little and try again in a minute.', 429);

  const comment = { id: uuid(), author_name: name, body: text, created_at: now() };
  await env.DB.prepare(
    'INSERT INTO comments (id, post_id, author_name, body, approved, created_at, client_id, ip_hash) VALUES (?, ?, ?, ?, 1, ?, ?, ?)'
  )
    .bind(comment.id, post.id, comment.author_name, comment.body, comment.created_at, clientId, hash)
    .run();

  return json({ ok: true, comment }, { status: 201 });
};
