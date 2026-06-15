// Shared JSON response helpers for Pages Functions.

export const json = (data, init = {}) =>
  new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(init.headers || {}),
    },
  });

export const error = (message, status = 400) => json({ error: message }, { status });

export const notFound = (message = 'Not found') => error(message, 404);

export const unauthorized = (message = 'Unauthorized') => error(message, 401);

// Wrap a handler so thrown errors become a clean 500 instead of a stack dump.
export const handle = (fn) => async (ctx) => {
  try {
    return await fn(ctx);
  } catch (err) {
    console.error('Function error:', err && err.stack ? err.stack : err);
    return error('Internal error', 500);
  }
};
