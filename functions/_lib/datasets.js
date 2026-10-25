// Dataset helpers shared by the public and admin routes.
import { now, uuid } from './util.js';

export const KINDS = ['dataset', 'result', 'discovery'];

export const filesFor = async (db, datasetId) => {
  const { results } = await db
    .prepare('SELECT id, name, url, mime, size FROM dataset_files WHERE dataset_id = ? ORDER BY position, created_at')
    .bind(datasetId)
    .all();
  return results;
};

// Published posts/papers a dataset is attached to.
export const linksFor = async (db, datasetId, { publishedOnly = true } = {}) => {
  const pub = publishedOnly ? "AND t.status = 'published'" : '';
  const posts = await db
    .prepare(
      `SELECT t.id, t.slug, t.title, 'post' AS type FROM dataset_links l JOIN posts t ON t.id = l.target_id
       WHERE l.dataset_id = ? AND l.target_type = 'post' ${pub}`
    )
    .bind(datasetId)
    .all();
  const papers = await db
    .prepare(
      `SELECT t.id, t.slug, t.title, 'paper' AS type FROM dataset_links l JOIN papers t ON t.id = l.target_id
       WHERE l.dataset_id = ? AND l.target_type = 'paper' ${pub}`
    )
    .bind(datasetId)
    .all();
  return [...posts.results, ...papers.results];
};

// Published datasets attached to one post or paper (for its "See data" button).
export const datasetsFor = async (db, targetType, targetId) => {
  const { results } = await db
    .prepare(
      `SELECT d.slug, d.title, d.kind, (SELECT COUNT(*) FROM dataset_files f WHERE f.dataset_id = d.id) AS files
       FROM dataset_links l JOIN datasets d ON d.id = l.dataset_id
       WHERE l.target_type = ? AND l.target_id = ? AND d.status = 'published'
       ORDER BY d.published_at DESC`
    )
    .bind(targetType, targetId)
    .all();
  return results;
};

// ── Admin writes: fields, plus files and links (each replaces the previous set) ──

export const cleanDataset = (b, existing = {}) => ({
  title: String(b.title ?? existing.title ?? '').trim().slice(0, 300),
  kind: KINDS.includes(b.kind) ? b.kind : existing.kind || 'dataset',
  summary: String(b.summary ?? existing.summary ?? '').trim().slice(0, 6000),
});

const cleanFiles = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((f) => f && typeof f.key === 'string' && typeof f.url === 'string' && f.url.startsWith('/api/media/'))
    .slice(0, 200)
    .map((f, i) => ({
      key: f.key.slice(0, 500),
      url: f.url.slice(0, 600),
      name: String(f.name || f.key.split('/').pop()).slice(0, 200),
      mime: String(f.mime || 'application/octet-stream').slice(0, 120),
      size: Number(f.size) || null,
      position: i,
    }));

const cleanLinks = (list) =>
  (Array.isArray(list) ? list : [])
    .filter((l) => l && ['post', 'paper'].includes(l.type) && typeof l.id === 'string')
    .slice(0, 100);

export const saveChildren = async (env, datasetId, body) => {
  const stmts = [];
  if (body.files !== undefined) {
    const files = cleanFiles(body.files);
    const { results: old } = await env.DB.prepare('SELECT r2_key FROM dataset_files WHERE dataset_id = ?')
      .bind(datasetId)
      .all();
    const keep = new Set(files.map((f) => f.key));
    await Promise.all(old.filter((o) => !keep.has(o.r2_key)).map((o) => env.MEDIA.delete(o.r2_key).catch(() => {})));
    stmts.push(env.DB.prepare('DELETE FROM dataset_files WHERE dataset_id = ?').bind(datasetId));
    const ts = now();
    files.forEach((f) =>
      stmts.push(
        env.DB.prepare(
          'INSERT INTO dataset_files (id, dataset_id, name, r2_key, url, mime, size, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(uuid(), datasetId, f.name, f.key, f.url, f.mime, f.size, f.position, ts)
      )
    );
  }
  if (body.links !== undefined) {
    stmts.push(env.DB.prepare('DELETE FROM dataset_links WHERE dataset_id = ?').bind(datasetId));
    cleanLinks(body.links).forEach((l) =>
      stmts.push(
        env.DB.prepare('INSERT OR IGNORE INTO dataset_links (dataset_id, target_type, target_id) VALUES (?, ?, ?)').bind(
          datasetId,
          l.type,
          l.id
        )
      )
    );
  }
  if (stmts.length) await env.DB.batch(stmts);
};
