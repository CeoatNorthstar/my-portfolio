import { json } from '../../_lib/response.js';

// GET /api/admin/messages — contact inbox, newest first.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, name, email, body, read, created_at FROM messages ORDER BY created_at DESC LIMIT 200'
  ).all();
  return json({ messages: results.map((m) => ({ ...m, read: !!m.read })) });
};
