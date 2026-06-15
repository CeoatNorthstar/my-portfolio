// Lightweight client for the Pages Functions API.

const CLIENT_KEY = 'sc_client_id';

// Stable anonymous id for like/favorite dedupe.
export const getClientId = () => {
  let id = localStorage.getItem(CLIENT_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64);
    localStorage.setItem(CLIENT_KEY, id);
  }
  return id;
};

const ADMIN_TOKEN_KEY = 'sc_admin_token';
export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY) || '';
export const setAdminToken = (t) => {
  if (t) localStorage.setItem(ADMIN_TOKEN_KEY, t);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
};

// Attach the admin token header on admin API calls (Access works without it too).
const adminHeaders = (path) => {
  const token = getAdminToken();
  return path.startsWith('/api/admin') && token ? { 'X-Admin-Token': token } : {};
};

const request = async (path, options = {}) => {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(path),
      ...(options.headers || {}),
    },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON (e.g. media) */
  }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
};

export const getConfig = () => request('/api/config');

// ── Public ──
export const listPosts = ({ type = 'all', q = '' } = {}) => {
  const params = new URLSearchParams();
  if (type && type !== 'all') params.set('type', type);
  if (q) params.set('q', q);
  const qs = params.toString();
  return request(`/api/posts${qs ? `?${qs}` : ''}`);
};

export const getLatestPost = () => request('/api/posts/latest');

export const getPost = (slug) =>
  request(`/api/posts/${encodeURIComponent(slug)}?cid=${encodeURIComponent(getClientId())}`);

export const getComments = (postId) =>
  request(`/api/posts/${encodeURIComponent(postId)}/comments`);

export const postComment = (postId, payload) =>
  request(`/api/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const toggleLike = (postId) =>
  request(`/api/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    body: JSON.stringify({ clientId: getClientId() }),
  });

export const toggleFavorite = (postId) =>
  request(`/api/posts/${encodeURIComponent(postId)}/favorite`, {
    method: 'POST',
    body: JSON.stringify({ clientId: getClientId() }),
  });

export const sendContact = (payload) =>
  request('/api/contact', { method: 'POST', body: JSON.stringify(payload) });

export const createCheckoutSession = () =>
  request('/api/stripe/checkout-session', { method: 'POST', body: '{}' });

// ── Admin (Cloudflare Access gated) ──
export const admin = {
  me: () => request('/api/admin/me'),
  listPosts: () => request('/api/admin/posts'),
  getPost: (id) => request(`/api/admin/posts/${id}`),
  createPost: (payload) =>
    request('/api/admin/posts', { method: 'POST', body: JSON.stringify(payload) }),
  updatePost: (id, payload) =>
    request(`/api/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deletePost: (id) => request(`/api/admin/posts/${id}`, { method: 'DELETE' }),
  listComments: (status = 'pending') => request(`/api/admin/comments?status=${status}`),
  setCommentApproved: (id, approved) =>
    request(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ approved }),
    }),
  deleteComment: (id) => request(`/api/admin/comments/${id}`, { method: 'DELETE' }),
  listMessages: () => request('/api/admin/messages'),
  upload: async (file, postId = null) => {
    const form = new FormData();
    form.append('file', file);
    if (postId) form.append('post_id', postId);
    const token = getAdminToken();
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: token ? { 'X-Admin-Token': token } : {},
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
    return data;
  },
};
