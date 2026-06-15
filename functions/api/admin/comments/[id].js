import { json, notFound } from '../../../_lib/response.js';

// PATCH /api/admin/comments/:id — approve / unapprove.
export const onRequestPatch = async ({ params, request, env }) => {
  const b = await request.json().catch(() => ({}));
  const approved = b.approved ? 1 : 0;
  const res = await env.DB.prepare('UPDATE comments SET approved = ? WHERE id = ?')
    .bind(approved, params.id)
    .run();
  if (!res.meta || res.meta.changes === 0) return notFound('Comment not found');
  return json({ ok: true, approved: !!approved });
};

// DELETE /api/admin/comments/:id
export const onRequestDelete = async ({ params, env }) => {
  const res = await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(params.id).run();
  if (!res.meta || res.meta.changes === 0) return notFound('Comment not found');
  return json({ ok: true });
};
