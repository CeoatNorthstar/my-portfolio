import { json, error, notFound } from '../../../_lib/response.js';
import { cleanReferences, publicationTime } from '../../../_lib/payload.js';
import { toPaper } from '../../../_lib/db.js';
import { now, slugify, uniqueSlug, normalizeKeywords } from '../../../_lib/util.js';

// GET /api/admin/papers/:id
export const onRequestGet = async ({ params, env }) => {
  const row = await env.DB.prepare('SELECT * FROM papers WHERE id = ?').bind(params.id).first();
  if (!row) return notFound('Paper not found');
  return json({ paper: { ...toPaper(row), pdf_key: row.pdf_key } });
};

// PUT /api/admin/papers/:id — edit fields, swap the PDF, publish/unpublish.
export const onRequestPut = async ({ params, request, env }) => {
  const existing = await env.DB.prepare('SELECT * FROM papers WHERE id = ?').bind(params.id).first();
  if (!existing) return notFound('Paper not found');

  const b = await request.json().catch(() => ({}));
  const title = String(b.title ?? existing.title).trim().slice(0, 400);
  if (!title) return error('Title is required');

  let slug = existing.slug;
  const desired = slugify(b.slug || title);
  if (desired !== existing.slug) slug = await uniqueSlug(env.DB, desired, existing.id, 'papers');

  const status = ['published', 'draft'].includes(b.status) ? b.status : existing.status;
  const ts = now();
  let publishedAt = existing.published_at;
  if (status === 'published') {
    publishedAt = b.published_date
      ? publicationTime(b.published_date, existing.published_at || ts)
      : existing.published_at || ts;
  } else {
    publishedAt = null;
  }

  // Replacing the PDF: drop the old object from R2.
  const pdfKey = b.pdf_key || existing.pdf_key;
  if (b.pdf_key && existing.pdf_key && b.pdf_key !== existing.pdf_key) {
    await env.MEDIA.delete(existing.pdf_key).catch(() => {});
  }

  await env.DB.prepare(
    `UPDATE papers SET slug = ?, title = ?, authors = ?, abstract = ?, references_json = ?, keywords = ?, pdf_key = ?,
       pdf_url = ?, pdf_name = ?, pdf_size = ?, page_count = ?, status = ?, updated_at = ?, published_at = ? WHERE id = ?`
  )
    .bind(
      slug,
      title,
      String(b.authors ?? existing.authors).trim().slice(0, 300) || 'Naol Demisse',
      String(b.abstract ?? existing.abstract ?? '').trim().slice(0, 8000),
      b.references !== undefined ? JSON.stringify(cleanReferences(b.references)) : existing.references_json,
      b.keywords !== undefined ? normalizeKeywords(b.keywords) : existing.keywords,
      pdfKey,
      b.pdf_url || existing.pdf_url,
      b.pdf_name !== undefined ? String(b.pdf_name).slice(0, 200) : existing.pdf_name,
      b.pdf_size !== undefined ? Number(b.pdf_size) || null : existing.pdf_size,
      b.page_count !== undefined ? Number(b.page_count) || null : existing.page_count,
      status,
      ts,
      publishedAt,
      existing.id
    )
    .run();

  return json({ paper: { id: existing.id, slug, status } });
};

// DELETE /api/admin/papers/:id — removes the row and its PDF.
export const onRequestDelete = async ({ params, env }) => {
  const row = await env.DB.prepare('SELECT pdf_key FROM papers WHERE id = ?').bind(params.id).first();
  if (!row) return notFound('Paper not found');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM papers WHERE id = ?').bind(params.id),
    env.DB.prepare("DELETE FROM dataset_links WHERE target_type = 'paper' AND target_id = ?").bind(params.id),
  ]);
  if (row.pdf_key) await env.MEDIA.delete(row.pdf_key).catch(() => {});
  return json({ ok: true });
};
