import { json, error } from '../../../_lib/response.js';
import { cleanReferences, publicationTime } from '../../../_lib/payload.js';
import { newestPaperId, toPaper } from '../../../_lib/db.js';
import { uuid, now, slugify, uniqueSlug, normalizeKeywords } from '../../../_lib/util.js';

// GET /api/admin/papers — every paper (drafts included).
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    'SELECT * FROM papers ORDER BY COALESCE(published_at, updated_at) DESC'
  ).all();
  const newId = await newestPaperId(env.DB);
  return json({ papers: results.map((r) => toPaper(r, newId)) });
};

// POST /api/admin/papers — create a paper from an uploaded PDF + extracted fields.
export const onRequestPost = async ({ request, env }) => {
  const b = await request.json().catch(() => ({}));
  const title = String(b.title || '').trim().slice(0, 400);
  if (!title) return error('Title is required');
  if (!b.pdf_url || !b.pdf_key) return error('Upload the PDF first');

  const id = uuid();
  const slug = await uniqueSlug(env.DB, slugify(b.slug || title), null, 'papers');
  const ts = now();
  const status = b.status === 'published' ? 'published' : 'draft';

  await env.DB.prepare(
    `INSERT INTO papers (id, slug, title, authors, abstract, references_json, keywords, pdf_key, pdf_url, pdf_name,
       pdf_size, page_count, status, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      slug,
      title,
      String(b.authors || 'Naol Demisse').trim().slice(0, 300) || 'Naol Demisse',
      String(b.abstract || '').trim().slice(0, 8000),
      JSON.stringify(cleanReferences(b.references)),
      normalizeKeywords(b.keywords),
      String(b.pdf_key),
      String(b.pdf_url),
      String(b.pdf_name || '').slice(0, 200),
      Number(b.pdf_size) || null,
      Number(b.page_count) || null,
      status,
      ts,
      ts,
      status === 'published' ? publicationTime(b.published_date, ts) : null
    )
    .run();

  return json({ paper: { id, slug, status } }, { status: 201 });
};
