// Cloudflare Access (Zero-Trust) JWT verification.
//
// When an Access application protects /admin* and /api/admin/*, Cloudflare
// injects a signed JWT in the `Cf-Access-Jwt-Assertion` header (and the
// `CF_Authorization` cookie). We verify it here so the API is safe even if a
// route is hit directly. RS256 verified against the team's JWKS endpoint.

const b64urlToUint8 = (s) => {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
};

const decodeJson = (segment) => JSON.parse(new TextDecoder().decode(b64urlToUint8(segment)));

let certCache = { domain: null, keys: null, fetchedAt: 0 };

const getKeys = async (teamDomain) => {
  const fresh = certCache.domain === teamDomain && Date.now() - certCache.fetchedAt < 3600_000;
  if (fresh && certCache.keys) return certCache.keys;
  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('Failed to fetch Access certs');
  const data = await res.json();
  certCache = { domain: teamDomain, keys: data.keys || [], fetchedAt: Date.now() };
  return certCache.keys;
};

const getToken = (request) => {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Returns the verified identity ({ email, ... }) or null.
 */
export const verifyAccess = async (request, env) => {
  // Local dev escape hatch — only when explicitly enabled in .dev.vars.
  if (env.DEV_ADMIN_BYPASS === 'true') {
    return { email: env.CONTACT_TO_EMAIL || 'dev@localhost', dev: true };
  }

  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  const aud = env.CF_ACCESS_AUD;
  if (!teamDomain || !aud) return null;

  const token = getToken(request);
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }

  // Claim checks
  const audOk = Array.isArray(payload.aud) ? payload.aud.includes(aud) : payload.aud === aud;
  if (!audOk) return null;
  if (payload.iss && payload.iss !== `https://${teamDomain}`) return null;
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;

  // Signature check
  const keys = await getKeys(teamDomain);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const sig = b64urlToUint8(parts[2]);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, signed);
  if (!valid) return null;

  return payload; // contains `email`, `sub`, etc.
};
