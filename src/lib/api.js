// Lightweight client for the Pages Functions API.
import { store } from './storage';

const CLIENT_KEY = 'sc_client_id';

// Stable anonymous id for like/favorite dedupe and comment aliases.
export const getClientId = () => {
  let id = store.get(CLIENT_KEY);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 64);
    store.set(CLIENT_KEY, id);
  }
  return id;
};

const ADMIN_TOKEN_KEY = 'sc_admin_token';
export const getAdminToken = () => store.get(ADMIN_TOKEN_KEY, '');
export const setAdminToken = (t) => store.set(ADMIN_TOKEN_KEY, t || null);

// Attach the admin token header on admin API calls (Access works without it too).
const adminHeaders = (path) => {
  const token = getAdminToken();
  return path.startsWith('/api/admin') && token ? { 'X-Admin-Token': token } : {};
};

const request = async (path, options = {}) => {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...adminHeaders(path),
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
};

const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) });
const cid = () => encodeURIComponent(getClientId());

// ── Public ──
// Shared by the card and the banner, so the page asks only once.
let homeRequest = null;
export const getHome = () => {
  if (!homeRequest) {
    homeRequest = request('/api/home').catch((err) => {
      homeRequest = null;
      throw err;
    });
  }
  return homeRequest;
};
export const listPosts = (q = '') => request(`/api/posts${q ? `?q=${encodeURIComponent(q)}` : ''}`);
export const listFavorites = () => request(`/api/favorites?cid=${cid()}`);
export const getPost = (slug) => request(`/api/posts/${encodeURIComponent(slug)}?cid=${cid()}`);
export const listPapers = () => request('/api/papers');
export const getPaper = (slug) => request(`/api/papers/${encodeURIComponent(slug)}`);
export const getPreview = (path) => request(`/api/preview?path=${encodeURIComponent(path)}`);
export const listData = () => request('/api/data');
export const getData = (slug) => request(`/api/data/${encodeURIComponent(slug)}`);

export const getComments = (postId, before) =>
  request(`/api/posts/${encodeURIComponent(postId)}/comments?limit=10${before ? `&before=${before}` : ''}`);
export const postComment = (postId, payload) =>
  post(`/api/posts/${encodeURIComponent(postId)}/comments`, { ...payload, clientId: getClientId() });
export const toggleLike = (postId) =>
  post(`/api/posts/${encodeURIComponent(postId)}/like`, { clientId: getClientId() });
export const toggleFavorite = (postId) =>
  post(`/api/posts/${encodeURIComponent(postId)}/favorite`, { clientId: getClientId() });

export const sendContact = (payload) => post('/api/contact', payload);

// ── Admin (token or Cloudflare Access gated) ──
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

export const admin = {
  me: () => request('/api/admin/me'),
  listPosts: () => request('/api/admin/posts'),
  getPost: (id) => request(`/api/admin/posts/${id}`),
  createPost: (payload) => post('/api/admin/posts', payload),
  updatePost: (id, payload) => put(`/api/admin/posts/${id}`, payload),
  deletePost: (id) => del(`/api/admin/posts/${id}`),
  listPapers: () => request('/api/admin/papers'),
  getPaper: (id) => request(`/api/admin/papers/${id}`),
  createPaper: (payload) => post('/api/admin/papers', payload),
  updatePaper: (id, payload) => put(`/api/admin/papers/${id}`, payload),
  deletePaper: (id) => del(`/api/admin/papers/${id}`),
  linkables: () => request('/api/admin/linkables'),
  listData: () => request('/api/admin/data'),
  getData: (id) => request(`/api/admin/data/${id}`),
  createData: (payload) => post('/api/admin/data', payload),
  updateData: (id, payload) => put(`/api/admin/data/${id}`, payload),
  deleteData: (id) => del(`/api/admin/data/${id}`),
  listComments: () => request('/api/admin/comments?status=all'),
  setCommentApproved: (id, approved) =>
    request(`/api/admin/comments/${id}`, { method: 'PATCH', body: JSON.stringify({ approved }) }),
  deleteComment: (id) => del(`/api/admin/comments/${id}`),
  listMessages: () => request('/api/admin/messages'),
  upload: async (file) => {
    const form = new FormData();
    form.append('file', file);
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
