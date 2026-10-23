import { json, error } from '../_lib/response.js';
import { uuid, now, ipHash } from '../_lib/util.js';

// POST /api/contact — store a message in the admin inbox.
// Spam guard: honeypot field + per-IP rate limit.
export const onRequestPost = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  if (body.website) return json({ ok: true });

  const name = String(body.name || '').trim().slice(0, 80) || 'Anonymous';
  const email = String(body.email || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 4000);

  if (!email || !message) return error('Email and message are required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return error('That email looks off');

  const hash = await ipHash(request);
  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS c FROM messages WHERE ip_hash = ? AND created_at > ?'
  )
    .bind(hash, now() - 10 * 60_000)
    .first();
  if ((recent?.c || 0) >= 3) return error('Too many messages, try again later.', 429);

  await env.DB.prepare(
    'INSERT INTO messages (id, name, email, body, read, created_at, ip_hash) VALUES (?, ?, ?, ?, 0, ?, ?)'
  )
    .bind(uuid(), name, email, message, now(), hash)
    .run();

  return json({ ok: true });
};
