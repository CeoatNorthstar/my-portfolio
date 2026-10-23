// Small shared utilities.

export const now = () => Date.now();

export const uuid = () => crypto.randomUUID();

export const DAY_MS = 24 * 60 * 60 * 1000;

// A paper wears the "new" label for a week after it is published.
export const NEW_WINDOW_MS = 7 * DAY_MS;

export const slugify = (text) =>
  String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';

// Ensure a slug is unique within a table (append -2, -3, ... if taken).
export const uniqueSlug = async (db, base, excludeId = null, table = 'posts') => {
  if (!['posts', 'papers'].includes(table)) throw new Error('Unknown table');
  let slug = base;
  let n = 1;
  /* eslint-disable no-await-in-loop */
  while (true) {
    const row = await db
      .prepare(`SELECT id FROM ${table} WHERE slug = ? LIMIT 1`)
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

// One-way hash of the caller's IP, used only for rate limiting.
export const ipHash = async (request) => {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const bytes = new TextEncoder().encode(`naol.me:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

// Plain text from sanitized HTML (for excerpts and reading time).
export const htmlToText = (html) =>
  String(html || '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/?(a|strong|em|b|i|u|s|code|span|sub|sup|mark)\b[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

export const readingMinutes = (html) => {
  const words = htmlToText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
};

export const parseJsonArray = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Only allow http(s) and site-relative links in user-supplied URLs.
export const safeUrl = (value) => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url.slice(0, 500);
  return /^https?:\/\//i.test(url) ? url.slice(0, 500) : '';
};

export const normalizeKeywords = (value) =>
  String(value || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 20)
    .join(', ');

// Anonymous commenters get a particle alias derived from their visitor id.
const ADJECTIVES = ['Curious', 'Quiet', 'Charmed', 'Strange', 'Wandering', 'Patient', 'Restless', 'Gentle', 'Bright', 'Entangled'];
const PARTICLES = ['Muon', 'Gluon', 'Photon', 'Neutrino', 'Quark', 'Boson', 'Tau', 'Pion', 'Kaon', 'Positron', 'Lepton', 'Tachyon'];

export const anonymousAlias = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${PARTICLES[Math.floor(h / ADJECTIVES.length) % PARTICLES.length]}`;
};
