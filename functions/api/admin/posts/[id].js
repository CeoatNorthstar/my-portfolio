import { json, error, notFound } from '../../../_lib/response.js';
import { sanitizeHtml } from '../../../_lib/sanitize.js';
import { now, slugify, uniqueSlug } from '../../../_lib/util.js';

// GET /api/admin/posts/:id — full post for editing (drafts included).
export const onRequestGet = async ({ params, env }) => {
  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(params.id).first();
  if (!post) return notFound('Post not found');
  return json({
    post: {
      ...post,
      featured: !!post.featured,
      body_json: post.body_json ? JSON.parse(post.body_json) : null,
    },
  });
};

// PUT /api/admin/posts/:id — update.
export const onRequestPut = async ({ params, request, env }) => {
  const existing = await env.DB.prepare('SELECT * FROM posts WHERE id = ?')
    .bind(params.id)
    .first();
  if (!existing) return notFound('Post not found');

  const b = await request.json().catch(() => ({}));
  const title = String(b.title ?? existing.title).trim();
  if (!title) return error('Title is required');

  // Re-slug only if the title/slug actually changed.
  let slug = existing.slug;
  const desired = slugify(b.slug || title);
  if (desired !== existing.slug) slug = await uniqueSlug(env.DB, desired, existing.id);

  const status = b.status === 'published' ? 'published' : b.status === 'draft' ? 'draft' : existing.status;
  const type = ['article', 'research', 'link'].includes(b.type) ? b.type : existing.type;
  const ts = now();
  // Set published_at the first time it becomes published.
  let publishedAt = existing.published_at;
  if (status === 'published' && !existing.published_at) publishedAt = ts;
  if (status === 'draft') publishedAt = null;

  const bodyHtml = b.body_html !== undefined ? sanitizeHtml(b.body_html) : existing.body_html;
  const bodyJson =
    b.body_json !== undefined ? (b.body_json ? JSON.stringify(b.body_json) : null) : existing.body_json;

  await env.DB.prepare(
    `UPDATE posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, body_html = ?, cover_url = ?, type = ?, link_url = ?, status = ?, featured = ?, updated_at = ?, published_at = ? WHERE id = ?`
  )
    .bind(
      slug,
      title,
      b.excerpt !== undefined ? String(b.excerpt).slice(0, 400) : existing.excerpt,
      bodyJson,
      bodyHtml,
      b.cover_url !== undefined ? b.cover_url : existing.cover_url,
      type,
      b.link_url !== undefined ? b.link_url : existing.link_url,
      status,
      b.featured !== undefined ? (b.featured ? 1 : 0) : existing.featured,
      ts,
      publishedAt,
      existing.id
    )
    .run();

  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(existing.id).first();
  return json({ post: { ...post, featured: !!post.featured } });
};

// DELETE /api/admin/posts/:id
export const onRequestDelete = async ({ params, env }) => {
  const res = await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(params.id).run();
  if (!res.meta || res.meta.changes === 0) return notFound('Post not found');
  return json({ ok: true });
};
