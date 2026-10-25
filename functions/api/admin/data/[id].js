import { json, error, notFound } from '../../../_lib/response.js';
import { cleanDataset, linksFor, saveChildren } from '../../../_lib/datasets.js';
import { now, slugify, uniqueSlug } from '../../../_lib/util.js';

// GET /api/admin/data/:id — dataset with files (incl. R2 keys) and all links.
export const onRequestGet = async ({ params, env }) => {
  const row = await env.DB.prepare('SELECT * FROM datasets WHERE id = ?').bind(params.id).first();
  if (!row) return notFound('Dataset not found');
  const { results: files } = await env.DB.prepare(
    'SELECT r2_key AS key, name, url, mime, size FROM dataset_files WHERE dataset_id = ? ORDER BY position, created_at'
  )
    .bind(row.id)
    .all();
  const links = await linksFor(env.DB, row.id, { publishedOnly: false });
  return json({ dataset: { ...row, files, links } });
};

// PUT /api/admin/data/:id — edit fields, replace files and links.
export const onRequestPut = async ({ params, request, env }) => {
  const existing = await env.DB.prepare('SELECT * FROM datasets WHERE id = ?').bind(params.id).first();
  if (!existing) return notFound('Dataset not found');

  const b = await request.json().catch(() => ({}));
  const fields = cleanDataset(b, existing);
  if (!fields.title) return error('Title is required');

  let slug = existing.slug;
  const desired = slugify(b.slug || fields.title);
  if (desired !== existing.slug) slug = await uniqueSlug(env.DB, desired, existing.id, 'datasets');

  const status = ['published', 'draft'].includes(b.status) ? b.status : existing.status;
  const ts = now();
  let publishedAt = existing.published_at;
  if (status === 'published' && !publishedAt) publishedAt = ts;
  if (status === 'draft') publishedAt = null;

  await env.DB.prepare(
    'UPDATE datasets SET slug = ?, title = ?, kind = ?, summary = ?, status = ?, updated_at = ?, published_at = ? WHERE id = ?'
  )
    .bind(slug, fields.title, fields.kind, fields.summary, status, ts, publishedAt, existing.id)
    .run();
  await saveChildren(env, existing.id, b);
  return json({ dataset: { id: existing.id, slug, status } });
};

// DELETE /api/admin/data/:id — removes the dataset, its links and its files in R2.
export const onRequestDelete = async ({ params, env }) => {
  const row = await env.DB.prepare('SELECT id FROM datasets WHERE id = ?').bind(params.id).first();
  if (!row) return notFound('Dataset not found');
  await saveChildren(env, row.id, { files: [], links: [] });
  await env.DB.prepare('DELETE FROM datasets WHERE id = ?').bind(row.id).run();
  return json({ ok: true });
};
