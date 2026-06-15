import { notFound } from '../../_lib/response.js';

// GET /api/media/<key> — stream a file from R2 (with HTTP range for video).
export const onRequestGet = async ({ params, request, env }) => {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key) return notFound();

  const range = request.headers.get('Range');
  const rangeMatch = range && range.match(/bytes=(\d*)-(\d*)/);

  let object;
  if (rangeMatch) {
    const start = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : undefined;
    const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;
    const opts = { range: {} };
    if (start !== undefined) opts.range.offset = start;
    if (end !== undefined && start !== undefined) opts.range.length = end - start + 1;
    object = await env.MEDIA.get(key, opts);
  } else {
    object = await env.MEDIA.get(key);
  }

  if (!object) return notFound('Media not found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Accept-Ranges', 'bytes');

  if (rangeMatch && object.range) {
    const total = object.size;
    const start = object.range.offset || 0;
    const length = object.range.length || total - start;
    const end = start + length - 1;
    headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
    return new Response(object.body, { status: 206, headers });
  }

  return new Response(object.body, { headers });
};
