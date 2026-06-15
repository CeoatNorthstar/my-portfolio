// Small shared utilities.

export const now = () => Date.now();

export const uuid = () => crypto.randomUUID();

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';

// Ensure a slug is unique within the posts table (append -2, -3, ... if taken).
export const uniqueSlug = async (db, base, excludeId = null) => {
  let slug = base;
  let n = 1;
  /* eslint-disable no-await-in-loop */
  while (true) {
    const row = await db
      .prepare('SELECT id FROM posts WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();
    if (!row || row.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
  /* eslint-enable no-await-in-loop */
};

export const escapeHtml = (s) =>
  String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Derive a stable per-visitor id for like/favorite dedupe. Prefers the
// client-supplied id (from localStorage); falls back to IP+UA hash.
export const clientIdFrom = (request, supplied) => {
  if (supplied && /^[a-zA-Z0-9_-]{8,64}$/.test(supplied)) return supplied;
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const ua = request.headers.get('User-Agent') || '';
  return `anon-${ip}-${ua}`.slice(0, 64);
};
