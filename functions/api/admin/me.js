import { json } from '../../_lib/response.js';

// GET /api/admin/me — confirms an authenticated admin session.
export const onRequestGet = ({ data }) =>
  json({ email: data.identity?.email || null, dev: !!data.identity?.dev });
