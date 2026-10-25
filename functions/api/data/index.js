import { json } from '../../_lib/response.js';

// GET /api/data — published datasets, results and discoveries, newest first.
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.slug, d.title, d.kind, d.summary, d.published_at,
       (SELECT COUNT(*) FROM dataset_files f WHERE f.dataset_id = d.id) AS files,
       (SELECT COUNT(*) FROM dataset_links l WHERE l.dataset_id = d.id) AS links
     FROM datasets d WHERE d.status = 'published' ORDER BY d.published_at DESC LIMIT 200`
  ).all();
  return json({ datasets: results });
};
