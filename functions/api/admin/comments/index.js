import { json } from '../../../_lib/response.js';

// GET /api/admin/comments?status=pending|all — moderation queue.
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  const where = status === 'pending' ? 'WHERE c.approved = 0' : '';
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.post_id, c.author_name, c.body, c.approved, c.created_at, p.title AS post_title, p.slug AS post_slug
     FROM comments c LEFT JOIN posts p ON p.id = c.post_id
     ${where} ORDER BY c.created_at DESC LIMIT 200`
  ).all();
  return json({ comments: results.map((c) => ({ ...c, approved: !!c.approved })) });
};
