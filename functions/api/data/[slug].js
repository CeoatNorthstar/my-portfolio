import { json, notFound } from '../../_lib/response.js';
import { filesFor, linksFor } from '../../_lib/datasets.js';

// GET /api/data/:slug — one dataset with its files and where it is used.
export const onRequestGet = async ({ params, env }) => {
  const row = await env.DB.prepare(
    "SELECT id, slug, title, kind, summary, published_at, updated_at FROM datasets WHERE slug = ? AND status = 'published'"
  )
    .bind(params.slug)
    .first();
  if (!row) return notFound('Dataset not found');
  return json({
    dataset: { ...row, files: await filesFor(env.DB, row.id), links: await linksFor(env.DB, row.id) },
  });
};
