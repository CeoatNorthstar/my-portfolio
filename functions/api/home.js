import { json } from '../_lib/response.js';
import { newestPaperId } from '../_lib/db.js';

// GET /api/home — tiny payload for the business card (is there a new paper?).
export const onRequestGet = async ({ env }) => {
  const id = await newestPaperId(env.DB);
  const paper = id
    ? await env.DB.prepare('SELECT slug, title FROM papers WHERE id = ?').bind(id).first()
    : null;
  return json(
    { newPaper: paper || null },
    { headers: { 'Cache-Control': 'public, max-age=60' } }
  );
};
