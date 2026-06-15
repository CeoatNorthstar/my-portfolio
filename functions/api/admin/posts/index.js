import { json, error } from '../../../_lib/response.js';
import { sanitizeHtml } from '../../../_lib/sanitize.js';
import { uuid, now, slugify, uniqueSlug } from '../../../_lib/util.js';

// GET /api/admin/posts — all posts (drafts included), newest first.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT id, slug, title, excerpt, type, status, featured, created_at, updated_at, published_at FROM posts ORDER BY updated_at DESC'
  ).all();
  return json({ posts: results.map((p) => ({ ...p, featured: !!p.featured })) });
};

// POST /api/admin/posts — create a post (draft or published).
export const onRequestPost = async ({ request, env }) => {
  const b = await request.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  if (!title) return error('Title is required');

  const id = uuid();
  const base = slugify(b.slug || title);
  const slug = await uniqueSlug(env.DB, base);
  const ts = now();
  const status = b.status === 'published' ? 'published' : 'draft';
  const type = ['article', 'research', 'link'].includes(b.type) ? b.type : 'article';
  const bodyHtml = sanitizeHtml(b.body_html || '');
  const bodyJson = b.body_json ? JSON.stringify(b.body_json) : null;
  const publishedAt = status === 'published' ? ts : null;

  await env.DB.prepare(
    `INSERT INTO posts (id, slug, title, excerpt, body_json, body_html, cover_url, type, link_url, status, featured, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      title,
      String(b.excerpt || '').slice(0, 400),
      bodyJson,
      bodyHtml,
      b.cover_url || null,
      type,
      b.link_url || null,
      status,
      b.featured ? 1 : 0,
      ts,
      ts,
      publishedAt
    )
    .run();

  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first();
  return json({ post: { ...post, featured: !!post.featured } }, { status: 201 });
};
