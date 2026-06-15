import { json } from '../../_lib/response.js';

// GET /api/posts/latest — powers the homepage "new post" banner.
export const onRequestGet = async ({ env }) => {
  const row = await env.DB.prepare(
    "SELECT id, slug, title, published_at FROM posts WHERE status = 'published' ORDER BY published_at DESC LIMIT 1"
  ).first();
  return json({ latest: row || null });
};
