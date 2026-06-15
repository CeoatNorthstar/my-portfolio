import { json, error } from '../_lib/response.js';
import { verifyTurnstile } from '../_lib/turnstile.js';
import { uuid, now } from '../_lib/util.js';

// POST /api/contact — store a message in the admin inbox (Turnstile-gated).
// Optionally forwards an email if an Email Routing send binding (SEND_EMAIL)
// is configured; storage in D1 is the guaranteed path.
export const onRequestPost = async ({ request, env }) => {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 80);
  const email = String(body.email || '').trim().slice(0, 120);
  const message = String(body.message || '').trim().slice(0, 4000);

  if (!name || !email || !message) return error('All fields are required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return error('Invalid email');

  const ok = await verifyTurnstile(body.turnstileToken, request, env);
  if (!ok) return error('Verification failed', 403);

  await env.DB.prepare(
    'INSERT INTO messages (id, name, email, body, read, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  )
    .bind(uuid(), name, email, message, now())
    .run();

  return json({ ok: true });
};
