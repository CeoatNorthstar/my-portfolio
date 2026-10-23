import { json, error, notFound } from '../_lib/response.js';
import { htmlToText } from '../_lib/util.js';

// GET /api/preview?path=/blog/<slug>|/papers/<slug> — hover-card data for
// internal links (Wikipedia-style page previews).
export const onRequestGet = async ({ request, env }) => {
  const path = new URL(request.url).searchParams.get('path') || '';
  const m = path.match(/^\/(blog|papers)\/([a-z0-9-]+)\/?$/);
  if (!m) return error('Unsupported path');
  const [, kind, slug] = m;

  let item = null;
  if (kind === 'blog') {
    const row = await env.DB.prepare(
      "SELECT title, excerpt, body_html, published_at FROM posts WHERE slug = ? AND status = 'published'"
    )
      .bind(slug)
      .first();
    if (row) {
      item = {
        type: 'post',
        title: row.title,
        summary: (row.excerpt || htmlToText(row.body_html)).slice(0, 280),
        published_at: row.published_at,
      };
    }
  } else {
    const row = await env.DB.prepare(
      "SELECT title, abstract, authors, published_at FROM papers WHERE slug = ? AND status = 'published'"
    )
      .bind(slug)
      .first();
    if (row) {
      item = {
        type: 'paper',
        title: row.title,
        summary: (row.abstract || '').slice(0, 280),
        authors: row.authors,
        published_at: row.published_at,
      };
    }
  }

  if (!item) return notFound();
  return json({ preview: item }, { headers: { 'Cache-Control': 'public, max-age=300' } });
};
