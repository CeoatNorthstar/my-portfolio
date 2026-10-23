// pdf.js is served from /vendor/pdfjs (copied by scripts/copy-pdfjs.js) and
// loaded only when a reader or the paper uploader actually needs it.
const BASE = `${process.env.PUBLIC_URL || ''}/vendor/pdfjs`;

let libPromise = null;

export const loadPdfjs = () => {
  if (!libPromise) {
    libPromise = import(/* webpackIgnore: true */ `${BASE}/pdf.min.mjs`)
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.mjs`;
        return lib;
      })
      .catch((err) => {
        libPromise = null;
        throw err;
      });
  }
  return libPromise;
};

// `source` is a URL string or an ArrayBuffer / Uint8Array.
export const openPdf = async (source) => {
  const lib = await loadPdfjs();
  const params = typeof source === 'string' ? { url: source } : { data: source };
  return lib.getDocument({
    ...params,
    cMapUrl: `${BASE}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${BASE}/standard_fonts/`,
    wasmUrl: `${BASE}/wasm/`,
    iccUrl: `${BASE}/iccs/`,
    isEvalSupported: false,
  }).promise;
};

// ─────────────────────────────────────────────────────────────
// Extraction: title, abstract, keywords and references from a paper.
// Heuristic by nature; every field stays editable in the admin form.
// ─────────────────────────────────────────────────────────────

const squash = (s) => s.replace(/\s+/g, '').toLowerCase();

// Group a page's text items into visual lines: { text, size, x, y, page }.
const readLines = async (page, pageNum) => {
  const content = await page.getTextContent();
  const lines = [];
  let cur = null;

  const flush = () => {
    if (cur && cur.text.trim()) {
      cur.text = cur.text.replace(/\s+/g, ' ').trim();
      lines.push(cur);
    }
    cur = null;
  };

  for (const item of content.items) {
    if (typeof item.str !== 'string') continue;
    const [, , c, d, x, y] = item.transform;
    const size = Math.round((Math.hypot(c, d) || item.height || 0) * 10) / 10;

    if (item.str.trim()) {
      const sameLine = cur && Math.abs(cur.y - y) <= Math.max(2, Math.max(size, cur.size) * 0.45);
      if (!sameLine) {
        flush();
        cur = { text: '', size, x, y, page: pageNum, end: x };
      }
      const gap = x - cur.end;
      if (cur.text && !/\s$/.test(cur.text) && !/^\s/.test(item.str) && gap > size * 0.12) cur.text += ' ';
      cur.text += item.str;
      cur.size = Math.max(cur.size, size);
      cur.x = Math.min(cur.x, x);
      cur.end = x + (item.width || 0);
    }
    if (item.hasEOL) flush();
  }
  flush();
  return lines;
};

// Join wrapped lines, repairing words hyphenated across line breaks.
const joinLines = (texts) =>
  texts
    .reduce((acc, t) => {
      if (!acc) return t;
      if (/[A-Za-z]-$/.test(acc) && /^[a-z]/.test(t)) return acc.slice(0, -1) + t;
      if (/[\u2013\u2014-]$/.test(acc) && /^\d/.test(t)) return acc + t; // page ranges
      return `${acc} ${t}`;
    }, '')
    .replace(/\s+/g, ' ')
    .trim();

const JUNK_TITLE = /^(arxiv|preprint|journal|vol\.?\s|volume|doi|https?:|page \d|submitted|accepted|published|received|copyright|©)/i;

const pickTitle = (lines, meta) => {
  const first = lines.filter((l) => l.page === 1);
  // Blocks of consecutive lines that share a font size.
  const blocks = [];
  for (const l of first) {
    const last = blocks[blocks.length - 1];
    if (last && Math.abs(last.size - l.size) < 0.6) last.lines.push(l);
    else blocks.push({ size: l.size, lines: [l] });
  }
  const candidates = blocks
    .map((b) => ({ size: b.size, text: joinLines(b.lines.map((l) => l.text)) }))
    .filter((b) => b.text.length >= 6 && b.text.length <= 300 && !JUNK_TITLE.test(b.text))
    .sort((a, b) => b.size - a.size);

  const metaTitle = (meta?.info?.Title || '').trim();
  const metaOk =
    metaTitle.length > 5 && !/untitled|microsoft word|\.(tex|pdf|dvi|docx?)$/i.test(metaTitle);

  if (candidates.length) return candidates[0].text;
  return metaOk ? metaTitle : '';
};

const STOP_ABSTRACT = /^((\d+|[ivx]+)\.?\s*)?(introduction|keywords?|key\s*words|index terms|pacs|subject|ccs concepts|msc|contents)\b/i;
const KEYWORDS_LABEL = /\b(keywords?|key\s*words|index terms)\s*[:.\u2014]\s*/i;

const SECTION_HEADING = /^([IVX]+|\d+)\.?\s+[A-Z][A-Z ,:'-]{3,}$/;
const FRONT_MATTER = /^\(?(dated|received|accepted|published|revised|preprint|arxiv)\b/i;

// No "Abstract" label (REVTeX / APS style): the abstract is the longest block
// of evenly spaced, same-size lines before the first section heading.
const unlabeledAbstract = (early) => {
  const stop = early.findIndex((l) => STOP_ABSTRACT.test(l.text) || SECTION_HEADING.test(l.text));
  const head = stop === -1 ? early.filter((l) => l.page === 1) : early.slice(0, stop);

  const runs = [];
  head.forEach((l, i) => {
    const prev = head[i - 1];
    const drop = prev ? prev.y - l.y : 0;
    // Raised math (roots, superscripts) can sit slightly above the line before it.
    const continues =
      prev && prev.page === l.page && Math.abs(prev.size - l.size) < 0.6 && drop > -l.size && drop < l.size * 2.2;
    if (continues) runs[runs.length - 1].push(l);
    else runs.push([l]);
  });

  const best = runs
    .map((run) => {
      // Skip author / affiliation / date lines at the top of the block.
      const first = run.findIndex((l) => l.text.length >= 50 && !FRONT_MATTER.test(l.text));
      return first === -1 ? '' : joinLines(run.slice(first).map((l) => l.text));
    })
    .sort((a, b) => b.length - a.length)[0];
  return best && best.length >= 200 ? best.slice(0, 4000) : '';
};

const pickAbstract = (lines) => {
  const early = lines.filter((l) => l.page <= 3);
  const start = early.findIndex((l) => squash(l.text).startsWith('abstract'));
  if (start === -1) return unlabeledAbstract(early);

  const out = [];
  const head = early[start].text.replace(/^\s*a\s*b\s*s\s*t\s*r\s*a\s*c\s*t\s*[.:—–-]?\s*/i, '');
  if (head) out.push(head);

  let bodySize = null;
  for (let i = start + 1; i < early.length; i += 1) {
    const l = early[i];
    if (STOP_ABSTRACT.test(l.text)) break;
    if (bodySize && l.size > bodySize * 1.15 && l.text.length < 90) break;
    if (!bodySize) bodySize = l.size;
    const kw = l.text.search(KEYWORDS_LABEL);
    if (kw > 0) {
      out.push(l.text.slice(0, kw)); // keywords run on after the last sentence
      break;
    }
    out.push(l.text);
    if (out.join(' ').length > 4000) break;
  }
  return joinLines(out);
};

const pickKeywords = (lines) => {
  const i = lines.findIndex((l) => l.page <= 3 && KEYWORDS_LABEL.test(l.text));
  if (i === -1) return '';
  const line = lines[i];
  let text = line.text.slice(line.text.search(KEYWORDS_LABEL)).replace(KEYWORDS_LABEL, '');
  const next = lines[i + 1];
  // Keyword lists often wrap onto one more short line.
  const wraps =
    next &&
    next.page === line.page &&
    Math.abs(next.size - line.size) < 0.6 &&
    next.text.length < 70 &&
    !/[.:]$/.test(text) &&
    !STOP_ABSTRACT.test(next.text);
  if (wraps) text += ` ${next.text}`;
  return text
    .split(/[;,·]/)
    .map((k) => k.trim().replace(/\.$/, ''))
    .filter((k) => k && k.length < 50)
    .slice(0, 10)
    .join(', ');
};

const REF_HEADING = /^((\d+|[ivx]+)\.?\s*)?(references|bibliography|works cited|literature cited|reference list)\s*:?$/i;
const REF_END = /^((\d+|[a-z])\.?\s*)?(appendix|appendices|supplementary|supplemental material)\b/i;

// Split reference-section lines into individual entries.
const splitReferences = (lines) => {
  const texts = lines.map((l) => l.text);
  const bracket = /^\[\d{1,3}\]/;
  const dotted = /^\d{1,3}\.\s+\S/;
  const spaced = /^\d{1,3}\s+[A-Z]/;

  const splitBy = (re) => {
    const entries = [];
    for (const t of texts) {
      if (re.test(t) || !entries.length) entries.push([t]);
      else entries[entries.length - 1].push(t);
    }
    return entries;
  };

  let entries;
  if (texts.filter((t) => bracket.test(t)).length >= 2) entries = splitBy(bracket);
  else if (texts.filter((t) => dotted.test(t)).length >= 2) entries = splitBy(dotted);
  else if (texts.filter((t) => spaced.test(t)).length >= 3) entries = splitBy(spaced);
  else {
    // Hanging indent: an entry starts at its column's left edge.
    const colStart = (l) => {
      const peers = lines.filter((o) => o.page === l.page && Math.abs(o.x - l.x) < 120);
      return Math.min(...peers.map((o) => o.x));
    };
    const indented = lines.filter((l) => l.x - colStart(l) > 4).length;
    if (indented >= 2 && indented < lines.length - 1) {
      entries = [];
      lines.forEach((l) => {
        if (l.x - colStart(l) <= 2 || !entries.length) entries.push([l.text]);
        else entries[entries.length - 1].push(l.text);
      });
    } else {
      // Last resort: an entry ends on a line that ends a sentence.
      entries = [];
      let buf = [];
      texts.forEach((t) => {
        buf.push(t);
        if (/[.)]$/.test(t)) {
          entries.push(buf);
          buf = [];
        }
      });
      if (buf.length) entries.push(buf);
    }
  }

  return entries
    .map((parts) => joinLines(parts).replace(/^(\[\d{1,3}\]|\d{1,3}\.(?=\s)|\d{1,3}(?=\s+[A-Z]))\s*/, ''))
    .filter((t) => t.length > 8);
};

const trimUrl = (u) => u.replace(/[.,;:)\]]+$/, '');

export const referenceUrl = (text) => {
  const doi = text.match(/\b(10\.\d{4,9}\/[^\s"<>]+)/i);
  if (doi) return `https://doi.org/${trimUrl(doi[1])}`;
  const arxiv = text.match(/arxiv:\s?(\d{4}\.\d{4,5}(v\d+)?|[a-z-]+(\.[A-Z]{2})?\/\d{7})/i);
  if (arxiv) return `https://arxiv.org/abs/${arxiv[1]}`;
  const url = text.match(/https?:\/\/[^\s<>"]+/i);
  return url ? trimUrl(url[0]) : '';
};

const pickReferences = (lines) => {
  let start = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (REF_HEADING.test(lines[i].text) || REF_HEADING.test(squash(lines[i].text))) {
      start = i;
      break;
    }
  }
  let from = start + 1;
  if (start === -1) {
    // No heading (REVTeX / APS style): the list starts at the last "[1]"
    // that is followed by a "[2]".
    from = -1;
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (/^\[1\]\s/.test(lines[i].text) && lines.slice(i + 1, i + 60).some((l) => /^\[2\]\s/.test(l.text))) {
        from = i;
        break;
      }
    }
    if (from === -1) return [];
  }

  const body = [];
  for (let i = from; i < lines.length; i += 1) {
    if (REF_END.test(lines[i].text)) break;
    if (/^\d{1,3}$/.test(lines[i].text)) continue; // page numbers
    body.push(lines[i]);
  }
  return splitReferences(body).map((text) => ({ text, url: referenceUrl(text) }));
};

/**
 * Read a PDF (ArrayBuffer) and pull out what the paper page needs.
 * Returns { title, abstract, keywords, references: [{ text, url }], pageCount }.
 */
export const extractPaper = async (data) => {
  const doc = await openPdf(data);
  try {
    const meta = await doc.getMetadata().catch(() => null);
    const lines = [];
    for (let n = 1; n <= doc.numPages; n += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(n);
      // eslint-disable-next-line no-await-in-loop
      lines.push(...(await readLines(page, n)));
      page.cleanup();
    }
    return {
      title: pickTitle(lines, meta),
      abstract: pickAbstract(lines),
      keywords: pickKeywords(lines),
      references: pickReferences(lines),
      pageCount: doc.numPages,
    };
  } finally {
    doc.destroy();
  }
};
