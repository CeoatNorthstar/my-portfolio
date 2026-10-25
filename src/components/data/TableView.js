import { useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber, niceTicks, numericColumns } from '../../lib/datafiles';

const MAX_ROWS = 400;
const MAX_POINTS = 4000;

const Table = ({ header, rows }) => (
  <div className="h-full overflow-auto scroll-thin">
    <table className="min-w-full text-[12.5px] font-mono tabular-nums border-separate border-spacing-0">
      <thead>
        <tr>
          <th className="sticky top-0 left-0 z-20 bg-card border-b border-r border-line px-3 py-2 text-left text-ink-3 font-normal">#</th>
          {header.map((h, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <th key={i} className="sticky top-0 z-10 bg-card border-b border-line px-3 py-2 text-left text-ink font-medium whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(0, MAX_ROWS).map((r, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={i} className="hover:bg-ink/[0.03]">
            <td className="sticky left-0 bg-card border-r border-line px-3 py-1.5 text-ink-3">{i + 1}</td>
            {header.map((_, j) => (
              // eslint-disable-next-line react/no-array-index-key
              <td key={j} className="px-3 py-1.5 text-ink-2 whitespace-nowrap border-b border-line/50">
                {r[j] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    {rows.length > MAX_ROWS && (
      <p className="px-3 py-3 label">Showing the first {MAX_ROWS} of {rows.length.toLocaleString()} rows. Download for the rest.</p>
    )}
  </div>
);

const M = { top: 16, right: 20, bottom: 44, left: 64 };

// One series: y against x, 2px line, crosshair + tooltip on hover.
const Plot = ({ header, rows, cols }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [xi, setXi] = useState(cols[0]?.i);
  const [yi, setYi] = useState((cols[1] || cols[0])?.i);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pts = useMemo(() => {
    const all = rows
      .map((r) => [Number(r[xi]), Number(r[yi])])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    const stride = Math.ceil(all.length / MAX_POINTS);
    return stride > 1 ? all.filter((_, i) => i % stride === 0) : all;
  }, [rows, xi, yi]);

  const height = 340;
  const iw = width - M.left - M.right;
  const ih = height - M.top - M.bottom;
  if (!pts.length) return <p className="p-6 text-[13px] text-ink-2">No numeric pairs to plot in these columns.</p>;

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const xt = niceTicks(Math.min(...xs), Math.max(...xs));
  const yt = niceTicks(Math.min(...ys), Math.max(...ys));
  const sx = (v) => M.left + ((v - xt.lo) / (xt.hi - xt.lo)) * iw;
  const sy = (v) => M.top + ih - ((v - yt.lo) / (yt.hi - yt.lo)) * ih;
  const sorted = xs.every((v, i) => i === 0 || v >= xs[i - 1]);
  const path = sorted ? pts.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join('') : '';
  const showDots = !sorted || pts.length <= 120;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * width;
    const my = ((e.clientY - rect.top) / rect.height) * height;
    let best = null;
    let bestD = Infinity;
    for (const p of pts) {
      const d = sorted ? Math.abs(sx(p[0]) - mx) : Math.hypot(sx(p[0]) - mx, sy(p[1]) - my);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setHover(best && bestD < 60 ? best : null);
  };

  const select =
    'bg-card border border-line rounded-md h-8 px-2 text-[12.5px] text-ink focus:outline-none focus:border-ink/30 max-w-[160px]';

  return (
    <div ref={wrapRef} className="p-4">
      <div className="flex flex-wrap items-center gap-3 mb-3 text-[12.5px] text-ink-2">
        <label className="flex items-center gap-2">
          y
          <select className={select} value={yi} onChange={(e) => setYi(Number(e.target.value))}>
            {cols.map((c) => (
              <option key={c.i} value={c.i}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          against x
          <select className={select} value={xi} onChange={(e) => setXi(Number(e.target.value))}>
            {cols.map((c) => (
              <option key={c.i} value={c.i}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <span className="label ml-auto">{pts.length.toLocaleString()} points</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="block overflow-visible select-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`${header[yi]} against ${header[xi]}`}
        >
          {yt.ticks.map((t) => (
            <g key={`y${t}`}>
              <line x1={M.left} x2={M.left + iw} y1={sy(t)} y2={sy(t)} stroke="rgb(var(--line))" strokeWidth="1" />
              <text x={M.left - 8} y={sy(t)} dy="0.32em" textAnchor="end" className="fill-ink-3 font-mono text-[10.5px]">
                {formatNumber(t)}
              </text>
            </g>
          ))}
          {xt.ticks.map((t) => (
            <text key={`x${t}`} x={sx(t)} y={M.top + ih + 18} textAnchor="middle" className="fill-ink-3 font-mono text-[10.5px]">
              {formatNumber(t)}
            </text>
          ))}
          <line x1={M.left} x2={M.left + iw} y1={M.top + ih} y2={M.top + ih} stroke="rgb(var(--ink) / 0.35)" strokeWidth="1" />
          <text x={M.left + iw / 2} y={height - 6} textAnchor="middle" className="fill-ink-2 text-[11.5px]">
            {header[xi]}
          </text>
          <text
            transform={`translate(14 ${M.top + ih / 2}) rotate(-90)`}
            textAnchor="middle"
            className="fill-ink-2 text-[11.5px]"
          >
            {header[yi]}
          </text>
          {path && <path d={path} fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinejoin="round" />}
          {showDots &&
            pts.map((p, i) => (
              // eslint-disable-next-line react/no-array-index-key
              <circle key={i} cx={sx(p[0])} cy={sy(p[1])} r="3" fill="rgb(var(--ink))" stroke="rgb(var(--card))" strokeWidth="1.5" />
            ))}
          {hover && (
            <g pointerEvents="none">
              <line x1={sx(hover[0])} x2={sx(hover[0])} y1={M.top} y2={M.top + ih} stroke="rgb(var(--ink) / 0.3)" strokeDasharray="3 3" />
              <circle cx={sx(hover[0])} cy={sy(hover[1])} r="4.5" fill="rgb(var(--ink))" stroke="rgb(var(--card))" strokeWidth="2" />
            </g>
          )}
        </svg>
        {hover && (
          <div
            className="absolute pointer-events-none bg-card border border-line rounded-md shadow-card px-2.5 py-1.5 font-mono text-[11px] text-ink whitespace-nowrap"
            style={{
              left: `${(sx(hover[0]) / width) * 100}%`,
              top: sy(hover[1]) - 46,
              transform: sx(hover[0]) > width * 0.7 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
            }}
          >
            <div>
              <span className="text-ink-3">{header[xi]}</span> {formatNumber(hover[0])}
            </div>
            <div>
              <span className="text-ink-3">{header[yi]}</span> {formatNumber(hover[1])}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TableView = ({ table }) => {
  const cols = useMemo(() => numericColumns(table.header, table.rows), [table]);
  const canPlot = cols.length >= 2;
  const [mode, setMode] = useState(canPlot ? 'plot' : 'table');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 px-4 h-10 border-b border-line shrink-0">
        {['plot', 'table'].map((m) => (
          <button
            key={m}
            type="button"
            disabled={m === 'plot' && !canPlot}
            onClick={() => setMode(m)}
            className={`label transition-colors disabled:opacity-40 ${mode === m ? '!text-ink' : 'hover:!text-ink'}`}
          >
            {m === 'plot' ? 'Plot' : `Table (${table.rows.length.toLocaleString()} rows)`}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto scroll-thin">
        {mode === 'plot' && canPlot ? <Plot header={table.header} rows={table.rows} cols={cols} /> : <Table {...table} />}
      </div>
    </div>
  );
};

export default TableView;
