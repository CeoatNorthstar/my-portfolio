import { json } from '../../_lib/response.js';
import { LIST_POSTS_SQL } from '../../_lib/db.js';

// GET /api/posts?q=  — published blog posts, newest first.
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();

  let sql = LIST_POSTS_SQL;
  const binds = [];
  if (q) {
    sql += ' AND (p.title LIKE ? OR p.excerpt LIKE ?)';
    binds.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY p.published_at DESC LIMIT 100';

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  return json({ posts: results });
};
