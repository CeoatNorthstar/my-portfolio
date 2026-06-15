// D1 query helpers and shared post serialization.

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
  const likes = await db
    .prepare('SELECT COUNT(*) AS c FROM likes WHERE post_id = ?')
    .bind(post.id)
    .first();
  const comments = await db
    .prepare('SELECT COUNT(*) AS c FROM comments WHERE post_id = ? AND approved = 1')
    .bind(post.id)
    .first();

  let liked = false;
  let favorited = false;
  if (clientId) {
    const l = await db
      .prepare('SELECT 1 FROM likes WHERE post_id = ? AND client_id = ? LIMIT 1')
      .bind(post.id, clientId)
      .first();
    const f = await db
      .prepare('SELECT 1 FROM favorites WHERE post_id = ? AND client_id = ? LIMIT 1')
      .bind(post.id, clientId)
      .first();
    liked = !!l;
    favorited = !!f;
  }

  return {
    ...post,
    featured: !!post.featured,
    likes: likes?.c || 0,
    comments: comments?.c || 0,
    liked,
    favorited,
  };
};

// Public-safe shape for list views (omit heavy body fields).
export const toListItem = (post) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  cover_url: post.cover_url,
  type: post.type,
  link_url: post.link_url,
  featured: !!post.featured,
  published_at: post.published_at,
  likes: post.likes || 0,
  comments: post.comments || 0,
});
