// Cloudflare Turnstile verification for public write endpoints.

// Cloudflare's documented "always passes" TEST secret — used as a local
// default so dev works without configuring a real widget.
const TEST_SECRET = '1x0000000000000000000000000000000AA';

export const verifyTurnstile = async (token, request, env) => {
  const secret = env.TURNSTILE_SECRET || TEST_SECRET;
  if (!token) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.append('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
};
