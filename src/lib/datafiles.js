// Helpers for previewing dataset files in the browser.

const TEXT_EXT = [
  'txt', 'md', 'log', 'dat', 'out', 'py', 'ipynb', 'c', 'h', 'cc', 'cpp', 'hpp', 'rs', 'go', 'swift', 'js', 'ts',
  'jl', 'm', 'r', 'sh', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'tex', 'bib', 'xml', 'kicad_sch', 'kicad_pcb', 'net',
];

export const fileKind = (name = '', mime = '') => {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['csv', 'tsv'].includes(ext) || /csv|tab-separated/.test(mime)) return 'table';
  if (['json', 'geojson'].includes(ext) || /json/.test(mime)) return 'json';
  if (/^image\//.test(mime) || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif'].includes(ext)) return 'image';
  if (/^video\//.test(mime) || ['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (/^audio\//.test(mime) || ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio';
  if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (TEXT_EXT.includes(ext) || /^text\//.test(mime)) return 'text';
  return 'binary';
};

export const MAX_PREVIEW = 2 * 1024 * 1024;

// Fetch at most MAX_PREVIEW bytes of a text file.
export const fetchText = async (url, size) => {
  const big = size && size > MAX_PREVIEW;
  const res = await fetch(url, big ? { headers: { Range: `bytes=0-${MAX_PREVIEW - 1}` } } : undefined);
  if (!res.ok) throw new Error('Could not load the file');
  return { text: await res.text(), truncated: !!big };
};

// RFC 4180-ish CSV/TSV parser. Skips blank lines and `#` comment lines.
export const parseDelimited = (text, { truncated = false } = {}) => {
  const sample = text.slice(0, 4000);
  const d = (sample.match(/\t/g) || []).length > (sample.match(/,/g) || []).length ? '\t' : ',';
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === d) {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (truncated) rows.pop(); // last row may be cut mid-way
  const clean = rows.filter((r) => !(r.length === 1 && r[0].trim() === '') && !r[0].trim().startsWith('#'));
  if (!clean.length) return { header: [], rows: [] };

  const isNum = (v) => v.trim() !== '' && Number.isFinite(Number(v));
  const hasHeader = clean[0].some((v) => v.trim() !== '' && !isNum(v));
  const width = Math.max(...clean.map((r) => r.length));
  const header = hasHeader
    ? Array.from({ length: width }, (_, i) => (clean[0][i] || `col ${i + 1}`).trim())
    : Array.from({ length: width }, (_, i) => `col ${i + 1}`);
  return { header, rows: hasHeader ? clean.slice(1) : clean };
};

// Columns where nearly every value is a number.
export const numericColumns = (header, rows) =>
  header
    .map((name, i) => {
      const vals = rows.map((r) => (r[i] ?? '').trim()).filter(Boolean);
      const nums = vals.filter((v) => Number.isFinite(Number(v)));
      return { name, i, ok: vals.length > 0 && nums.length / vals.length >= 0.9 };
    })
    .filter((c) => c.ok);

export const formatNumber = (n) => {
  if (!Number.isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) return n.toExponential(2);
  return Number(n.toPrecision(5)).toLocaleString('en-US', { maximumFractionDigits: 6 });
};

// 4-6 round tick values spanning [min, max].
export const niceTicks = (min, max, count = 5) => {
  let lo = min;
  let hi = max;
  if (lo === hi) {
    lo -= Math.abs(lo) * 0.1 || 1;
    hi += Math.abs(hi) * 0.1 || 1;
  }
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Number(v.toPrecision(12)));
  return { ticks, lo: start, hi: end };
};
