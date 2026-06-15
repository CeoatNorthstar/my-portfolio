import { json, error } from '../../_lib/response.js';
import { uuid, now } from '../../_lib/util.js';

const MAX_BYTES = 200 * 1024 * 1024; // 200 MB ceiling (videos)
const ALLOWED = [
  /^image\//,
  /^video\//,
  /^audio\//,
  /^application\/pdf$/,
  /^application\/zip$/,
  /^text\//,
];

const kindFor = (mime) => {
  if (/^image\//.test(mime)) return 'image';
  if (/^video\//.test(mime)) return 'video';
  return 'file';
};

// POST /api/admin/upload (multipart) — store a file in R2, return its URL.
export const onRequestPost = async ({ request, env }) => {
  const form = await request.formData().catch(() => null);
  if (!form) return error('Expected multipart form data');
  const file = form.get('file');
  if (!file || typeof file === 'string') return error('No file provided');

  const mime = file.type || 'application/octet-stream';
  if (!ALLOWED.some((re) => re.test(mime))) return error(`Unsupported file type: ${mime}`);
  if (file.size > MAX_BYTES) return error('File exceeds 200MB limit', 413);

  const safeName = (file.name || 'upload')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
  const key = `${new Date().getFullYear()}/${uuid()}-${safeName}`;

  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: mime },
  });

  const url = `/api/media/${key}`;
  const kind = kindFor(mime);
  await env.DB.prepare(
    'INSERT INTO media (id, post_id, kind, r2_key, url, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(uuid(), form.get('post_id') || null, kind, key, url, file.name || safeName, mime, file.size, now())
    .run();

  return json({ url, kind, mime, filename: file.name || safeName, size: file.size }, { status: 201 });
};
