import { json, error } from '../../../_lib/response.js';
import { uuid, now, slugify, uniqueSlug } from '../../../_lib/util.js';
import { cleanDataset, saveChildren } from '../../../_lib/datasets.js';

// GET /api/admin/data — every dataset (drafts included).
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.slug, d.title, d.kind, d.status, d.updated_at, d.published_at,
       (SELECT COUNT(*) FROM dataset_files f WHERE f.dataset_id = d.id) AS files,
       (SELECT COUNT(*) FROM dataset_links l WHERE l.dataset_id = d.id) AS links
     FROM datasets d ORDER BY d.updated_at DESC`
  ).all();
  return json({ datasets: results });
};

// POST /api/admin/data — create a dataset with its files and links.
export const onRequestPost = async ({ request, env }) => {
  const b = await request.json().catch(() => ({}));
  const fields = cleanDataset(b);
  if (!fields.title) return error('Title is required');

  const id = uuid();
  const slug = await uniqueSlug(env.DB, slugify(b.slug || fields.title), null, 'datasets');
  const ts = now();
  const status = b.status === 'published' ? 'published' : 'draft';
  await env.DB.prepare(
    'INSERT INTO datasets (id, slug, title, kind, summary, status, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(id, slug, fields.title, fields.kind, fields.summary, status, ts, ts, status === 'published' ? ts : null)
    .run();
  await saveChildren(env, id, b);
  return json({ dataset: { id, slug, status } }, { status: 201 });
};
