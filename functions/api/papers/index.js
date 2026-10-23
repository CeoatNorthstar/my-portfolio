import { json } from '../../_lib/response.js';
import { newestPaperId, toPaper } from '../../_lib/db.js';

// GET /api/papers — published papers, newest first (references omitted).
export const onRequestGet = async ({ env }) => {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, title, authors, abstract, page_count, published_at, updated_at, status FROM papers WHERE status = 'published' ORDER BY published_at DESC LIMIT 200"
  ).all();
  const newId = await newestPaperId(env.DB);
  return json({
    papers: results.map((r) => {
      const { references, ...rest } = toPaper(r, newId);
      return rest;
    }),
  });
};
