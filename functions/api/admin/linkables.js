import { json } from '../../_lib/response.js';

// GET /api/admin/linkables — everything published that a new post can link to
// (titles + keywords power the editor's link picker and auto-link).
export const onRequestGet = async ({ env }) => {
  const posts = await env.DB.prepare(
    "SELECT id, slug, title, keywords FROM posts WHERE status = 'published' ORDER BY published_at DESC"
  ).all();
  const papers = await env.DB.prepare(
    "SELECT id, slug, title, keywords FROM papers WHERE status = 'published' ORDER BY published_at DESC"
  ).all();
  return json({
    items: [
      ...posts.results.map((p) => ({ ...p, type: 'post', path: `/blog/${p.slug}` })),
      ...papers.results.map((p) => ({ ...p, type: 'paper', path: `/papers/${p.slug}` })),
    ],
  });
};
