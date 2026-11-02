import { notFound } from '../../_lib/response.js';
import { checkFileSignature } from '../../_lib/lulu.js';

// GET /api/store/print-file?k=&e=&s= — a book's print PDF, for Lulu only, through a signed,
// expiring link. Without a valid signature the file does not exist.
export const onRequestGet = async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get('k') || '';
  if (!(await checkFileSignature(env, key, url.searchParams.get('e'), url.searchParams.get('s')))) return notFound();
  const object = await env.MEDIA.get(key);
  if (!object) return notFound();
  return new Response(object.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Length': String(object.size),
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
};
