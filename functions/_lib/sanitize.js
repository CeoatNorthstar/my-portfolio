// Pragmatic HTML sanitizer for admin-authored post bodies.
//
// Post HTML only ever originates from the Access-gated admin editor (a single
// trusted author), so this is defense-in-depth rather than the sole barrier.
// Comments are never stored/rendered as HTML — they are escaped as plain text.
//
// Strips dangerous elements and attributes; allows <iframe> only for a small
// allowlist of embed hosts (YouTube/Vimeo).

const IFRAME_ALLOW = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/',
];

export const sanitizeHtml = (html) => {
  if (!html) return '';
  let out = String(html);

  // Remove dangerous elements entirely (with their content).
  out = out.replace(/<\s*(script|style|object|embed|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  out = out.replace(/<\s*(script|style|object|embed|link|meta|base)\b[^>]*\/?>/gi, '');

  // Strip inline event handlers (onclick, onerror, ...).
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Neutralize javascript:/vbscript: and non-image data: URLs in href/src.
  out = out.replace(/\b(href|src)\s*=\s*("|')\s*(javascript:|vbscript:)[^"']*\2/gi, '$1=$2#$2');
  out = out.replace(
    /\b(href|src)\s*=\s*("|')\s*data:(?!image\/)[^"']*\2/gi,
    '$1=$2#$2'
  );

  // Remove iframes whose src is not on the allowlist.
  out = out.replace(/<iframe\b[^>]*>(?:[\s\S]*?<\/iframe>)?/gi, (tag) => {
    const m = tag.match(/\bsrc\s*=\s*("|')([^"']*)\1/i);
    const src = m ? m[2] : '';
    return IFRAME_ALLOW.some((p) => src.startsWith(p)) ? tag : '';
  });

  return out;
};
