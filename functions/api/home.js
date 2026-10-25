import { json } from '../_lib/response.js';
import { newestPaperId } from '../_lib/db.js';
import { NEW_WINDOW_MS, now } from '../_lib/util.js';

// GET /api/home — tiny payload for the card and the "what's new" banner:
// the newest paper (for the nav dot) and the newest thing of any kind
// published in the last week.
export const onRequestGet = async ({ env }) => {
  const id = await newestPaperId(env.DB);
  const paper = id
    ? await env.DB.prepare('SELECT slug, title FROM papers WHERE id = ?').bind(id).first()
    : null;

  const since = now() - NEW_WINDOW_MS;
  const latest = await env.DB.prepare(
    `SELECT 'post' AS type, slug, title, NULL AS kind, published_at FROM posts WHERE status = 'published' AND published_at > ?1
     UNION ALL
     SELECT 'paper', slug, title, NULL, published_at FROM papers WHERE status = 'published' AND published_at > ?1
     UNION ALL
     SELECT 'data', slug, title, kind, published_at FROM datasets WHERE status = 'published' AND published_at > ?1
     ORDER BY published_at DESC LIMIT 1`
  )
    .bind(since)
    .first();

  return json(
    { newPaper: paper || null, latest: latest || null },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
};
