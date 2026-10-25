import { json, notFound } from '../../_lib/response.js';
import { newestPaperId, toPaper } from '../../_lib/db.js';
import { datasetsFor } from '../../_lib/datasets.js';

// GET /api/papers/:slug — full paper (abstract, extracted sources, PDF url).
export const onRequestGet = async ({ params, env }) => {
  const row = await env.DB.prepare("SELECT * FROM papers WHERE slug = ? AND status = 'published'")
    .bind(params.slug)
    .first();
  if (!row) return notFound('Paper not found');
  const newId = await newestPaperId(env.DB);
  return json({ paper: { ...toPaper(row, newId), datasets: await datasetsFor(env.DB, 'paper', row.id) } });
};
