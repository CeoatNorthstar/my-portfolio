// Normalize admin-submitted post/paper fields before they reach D1.
import { sanitizeHtml } from './sanitize.js';
import { htmlToText, normalizeKeywords, readingMinutes, safeUrl } from './util.js';

export const cleanSources = (list) =>
  (Array.isArray(list) ? list : [])
    .map((s) => ({
      title: String(s?.title || '').trim().slice(0, 300),
      url: safeUrl(s?.url),
    }))
    .filter((s) => s.title || s.url)
    .slice(0, 100);

export const cleanReferences = (list) =>
  (Array.isArray(list) ? list : [])
    .map((r) => ({
      text: String(r?.text || '').trim().slice(0, 1200),
      url: safeUrl(r?.url),
    }))
    .filter((r) => r.text)
    .slice(0, 400);

// Post body → stored html, excerpt fallback, reading time.
export const postBody = (b, existing = {}) => {
  const bodyHtml = b.body_html !== undefined ? sanitizeHtml(b.body_html) : existing.body_html || '';
  const excerptIn = b.excerpt !== undefined ? String(b.excerpt) : existing.excerpt || '';
  const excerpt = (excerptIn.trim() || htmlToText(bodyHtml).slice(0, 220)).slice(0, 400);
  return {
    bodyHtml,
    excerpt,
    readingMinutes: readingMinutes(bodyHtml),
    sourcesJson:
      b.sources !== undefined ? JSON.stringify(cleanSources(b.sources)) : existing.sources_json || '[]',
    keywords: b.keywords !== undefined ? normalizeKeywords(b.keywords) : existing.keywords || '',
  };
};

// Accept a yyyy-mm-dd publication date (noon UTC) or fall back.
export const publicationTime = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'number') return value;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return fallback;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  // Publishing "today" keeps the precise current time so ordering stays exact.
  const today = new Date(fallback).toISOString().slice(0, 10);
  return String(value) === today ? fallback : ts;
};
