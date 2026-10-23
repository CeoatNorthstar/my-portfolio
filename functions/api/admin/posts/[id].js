import { json, error, notFound } from '../../../_lib/response.js';
import { postBody } from '../../../_lib/payload.js';
import { now, slugify, uniqueSlug, parseJsonArray } from '../../../_lib/util.js';

// GET /api/admin/posts/:id — full post for editing (drafts included).
export const onRequestGet = async ({ params, env }) => {
  const post = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(params.id).first();
  if (!post) return notFound('Post not found');
  return json({
    post: {
      ...post,
      sources: parseJsonArray(post.sources_json),
      body_json: post.body_json ? JSON.parse(post.body_json) : null,
    },
  });
};

// PUT /api/admin/posts/:id — update.
export const onRequestPut = async ({ params, request, env }) => {
  const existing = await env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(params.id).first();
  if (!existing) return notFound('Post not found');

  const b = await request.json().catch(() => ({}));
  const title = String(b.title ?? existing.title).trim();
  if (!title) return error('Title is required');

  // Re-slug only if the title/slug actually changed.
  let slug = existing.slug;
  const desired = slugify(b.slug || title);
  if (desired !== existing.slug) slug = await uniqueSlug(env.DB, desired, existing.id);

  const status = ['published', 'draft'].includes(b.status) ? b.status : existing.status;
  const ts = now();
  // Set published_at the first time it becomes published.
  let publishedAt = existing.published_at;
  if (status === 'published' && !existing.published_at) publishedAt = ts;
  if (status === 'draft') publishedAt = null;

  const body = postBody(b, existing);
  const bodyJson =
    b.body_json !== undefined ? (b.body_json ? JSON.stringify(b.body_json) : null) : existing.body_json;

  await env.DB.prepare(
    `UPDATE posts SET slug = ?, title = ?, excerpt = ?, body_json = ?, body_html = ?, cover_url = ?, status = ?,
       updated_at = ?, published_at = ?, sources_json = ?, keywords = ?, reading_minutes = ? WHERE id = ?`
  )
    .bind(
      slug,
      title,
      body.excerpt,
      bodyJson,
      body.bodyHtml,
      b.cover_url !== undefined ? b.cover_url || null : existing.cover_url,
      status,
      ts,
      publishedAt,
      body.sourcesJson,
      body.keywords,
      body.readingMinutes,
      existing.id
    )
    .run();

  return json({ post: { id: existing.id, slug, status } });
};

// DELETE /api/admin/posts/:id
export const onRequestDelete = async ({ params, env }) => {
  const res = await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(params.id).run();
  if (!res.meta || res.meta.changes === 0) return notFound('Post not found');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(params.id),
    env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(params.id),
    env.DB.prepare('DELETE FROM favorites WHERE post_id = ?').bind(params.id),
  ]);
  return json({ ok: true });
};
