import { json, error } from '../../../_lib/response.js';
import { postBody } from '../../../_lib/payload.js';
import { uuid, now, slugify, uniqueSlug } from '../../../_lib/util.js';

// GET /api/admin/posts — all posts (drafts included), newest first.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.slug, p.title, p.excerpt, p.status, p.created_at, p.updated_at, p.published_at, p.reading_minutes,
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments,
       (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes
     FROM posts p ORDER BY p.updated_at DESC`
  ).all();
  return json({ posts: results });
};

// POST /api/admin/posts — create a blog post (draft or published).
export const onRequestPost = async ({ request, env }) => {
  const b = await request.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  if (!title) return error('Title is required');

  const id = uuid();
  const slug = await uniqueSlug(env.DB, slugify(b.slug || title));
  const ts = now();
  const status = b.status === 'published' ? 'published' : 'draft';
  const body = postBody(b);

  await env.DB.prepare(
    `INSERT INTO posts (id, slug, title, excerpt, body_json, body_html, cover_url, type, link_url, status, featured,
       created_at, updated_at, published_at, sources_json, keywords, reading_minutes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'article', NULL, ?, 0, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      title,
      body.excerpt,
      b.body_json ? JSON.stringify(b.body_json) : null,
      body.bodyHtml,
      b.cover_url || null,
      status,
      ts,
      ts,
      status === 'published' ? ts : null,
      body.sourcesJson,
      body.keywords,
      body.readingMinutes
    )
    .run();

  const post = await env.DB.prepare('SELECT id, slug, status FROM posts WHERE id = ?').bind(id).first();
  return json({ post }, { status: 201 });
};
