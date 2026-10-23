// D1 query helpers and shared post/paper serialization.
import { NEW_WINDOW_MS, now, parseJsonArray } from './util.js';

// Resolve a post by slug first, then by id (public routes use slug; the
// comment/like routes pass the post id).
export const resolvePost = async (db, idOrSlug, { publishedOnly = false } = {}) => {
  const where = publishedOnly ? "AND status = 'published'" : '';
  let row = await db
    .prepare(`SELECT * FROM posts WHERE slug = ? ${where} LIMIT 1`)
    .bind(idOrSlug)
    .first();
  if (!row) {
    row = await db
      .prepare(`SELECT * FROM posts WHERE id = ? ${where} LIMIT 1`)
      .bind(idOrSlug)
      .first();
  }
  return row;
};

// Attach like / comment counts (and the caller's own like/favorite state).
export const withCounts = async (db, post, clientId = null) => {
  if (!post) return null;
  const counts = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM likes WHERE post_id = ?1) AS likes,
         (SELECT COUNT(*) FROM comments WHERE post_id = ?1 AND approved = 1) AS comments,
         (SELECT COUNT(*) FROM likes WHERE post_id = ?1 AND client_id = ?2) AS liked,
         (SELECT COUNT(*) FROM favorites WHERE post_id = ?1 AND client_id = ?2) AS favorited`
    )
    .bind(post.id, clientId || '')
    .first();

  return {
    ...post,
    featured: !!post.featured,
    sources: parseJsonArray(post.sources_json),
    likes: counts?.likes || 0,
    comments: counts?.comments || 0,
    liked: !!counts?.liked,
    favorited: !!counts?.favorited,
  };
};

// Published posts with counts in a single query (list views omit the body).
export const LIST_POSTS_SQL = `
  SELECT p.id, p.slug, p.title, p.excerpt, p.cover_url, p.published_at, p.reading_minutes,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.approved = 1) AS comments
  FROM posts p
  WHERE p.status = 'published'`;

// The newest published paper keeps the "new" label for a week.
export const newestPaperId = async (db) => {
  const row = await db
    .prepare("SELECT id, published_at FROM papers WHERE status = 'published' ORDER BY published_at DESC LIMIT 1")
    .first();
  if (!row || !row.published_at) return null;
  return now() - row.published_at < NEW_WINDOW_MS ? row.id : null;
};

export const toPaper = (row, newId = null) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  authors: row.authors,
  abstract: row.abstract || '',
  keywords: row.keywords || '',
  references: parseJsonArray(row.references_json),
  pdf_url: row.pdf_url,
  pdf_name: row.pdf_name,
  pdf_size: row.pdf_size,
  page_count: row.page_count,
  status: row.status,
  published_at: row.published_at,
  updated_at: row.updated_at,
  is_new: !!newId && row.id === newId,
});
