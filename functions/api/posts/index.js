import { json } from '../../_lib/response.js';
import { withCounts, toListItem } from '../../_lib/db.js';

// GET /api/posts?type=&q=  — published posts, newest first.
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const q = (url.searchParams.get('q') || '').trim();

  let sql = "SELECT * FROM posts WHERE status = 'published'";
  const binds = [];
  if (type && type !== 'all') {
    sql += ' AND type = ?';
    binds.push(type);
  }
  if (q) {
    sql += ' AND (title LIKE ? OR excerpt LIKE ?)';
    binds.push(`%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY published_at DESC LIMIT 100';

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  const items = [];
  for (const p of results) {
    /* eslint-disable-next-line no-await-in-loop */
    items.push(toListItem(await withCounts(env.DB, p)));
  }
  return json({ posts: items });
};
