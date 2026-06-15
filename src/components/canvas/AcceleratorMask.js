import { useRef, useEffect, useCallback } from 'react';

/**
 * Accelerator Zoom Lens.
 *
 * As the cursor approaches (and especially when it sits on/over) the ring,
 * a magnifier lens grows under the pointer and "zooms into" the beamline —
 * concentric tube rings recede into depth while two particle bunches race
 * in from both sides and collide at the focal point. The closer you are,
 * the deeper the zoom: bigger lens, higher magnification, faster + brighter
 * collisions. Moving away smoothly zooms back out.
 *
 * Rendered with a single canvas + requestAnimationFrame for 60fps.
 */
const AcceleratorMask = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const mouse = useRef({ x: -500, y: -500, tx: -500, ty: -500 });
  const hover = useRef(false);
  const zoom = useRef(0); // 0 (out) → 1 (fully zoomed in)
  const time = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }
    const ctx = canvas.getContext('2d');
    const m = mouse.current;
    const t = time.current;

    // Smooth pointer follow
    m.x += (m.tx - m.x) * 0.18;
    m.y += (m.ty - m.y) * 0.18;

    const rect = container.getBoundingClientRect();
    const cxR = rect.width / 2;
    const cyR = rect.height / 2;
    // Match the engine's ring geometry exactly.
    const rx = Math.min(rect.width, rect.height) * 0.35;
    const ry = rx * 0.55;

    // Normalised radial distance from the ring centre (1 == on the ellipse).
    const nx = (m.x - cxR) / rx;
    const ny = (m.y - cyR) / ry;
    const radial = Math.sqrt(nx * nx + ny * ny);

    // Distance from the nearest point on the ellipse (for the approach ramp).
    const ang = Math.atan2(ny, nx);
    const nearX = cxR + Math.cos(ang) * rx;
    const nearY = cyR + Math.sin(ang) * ry;
    const distToRing = Math.hypot(m.x - nearX, m.y - nearY);

    // Target zoom: full inside the ring, ramps up on approach within 160px.
    let targetZoom = 0;
    if (hover.current && m.tx > -400) {
      if (radial <= 1) targetZoom = 1;
      else targetZoom = Math.max(0, 1 - distToRing / 160);
    }
    zoom.current += (targetZoom - zoom.current) * 0.09;
    const z = zoom.current;

    // Resize backing store if needed
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = rect.width;
    const h = rect.height;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);
    time.current += 0.016;

    if (z < 0.02) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const cx = m.x;
    const cy = m.y;
    const R = 38 + z * 62; // lens radius grows with zoom
    const mag = 1 + z * 2.6; // magnification of internal features

    ctx.save();
    // Clip to the circular lens
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Dark interior of the beam pipe
    ctx.fillStyle = '#04050a';
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // ── Tube depth: concentric ellipses receding toward the focal point ──
    const rings = 7;
    for (let i = 0; i < rings; i++) {
      // animate the rings outward to sell the "flying down the pipe" feel
      const phase = (t * 0.5 + i / rings) % 1;
      const rr = phase * R * 1.25 * (0.7 + z * 0.5);
      const a = (1 - phase) * 0.16 * z;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rr, rr * 0.62, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(170,200,255,${a})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    // Horizontal beamline guide
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.strokeStyle = `rgba(255,255,255,${0.05 * z})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Two particle bunches converging + colliding ──
    const cycle = (Math.sin(t * (1.4 + z * 1.6)) + 1) / 2; // 0..1
    const sep = (1 - cycle) * R * 0.85 + 2; // separation from centre
    const colliding = cycle > 0.93;
    const pr = 1.6 + z * 2.2; // particle radius scales with magnification

    const drawBunch = (dir) => {
      for (let i = 0; i < 5; i++) {
        const trail = i * 6 * mag * 0.4;
        const bx = cx + dir * (sep + trail);
        const by = cy + Math.sin(t * 5 + i + (dir > 0 ? Math.PI : 0)) * 1.2;
        const fade = (1 - i / 5) * 0.9;
        const s = pr * (1 - i / 8);

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, s * 4);
        g.addColorStop(0, `rgba(210,225,255,${fade})`);
        g.addColorStop(1, 'rgba(210,225,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, s * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fade})`;
        ctx.fill();
      }
    };
    drawBunch(-1);
    drawBunch(1);

    // ── Collision flash + debris ──
    if (colliding) {
      const flash = (cycle - 0.93) / 0.07;
      const fr = R * 0.9 * flash;
      const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, fr);
      fg.addColorStop(0, `rgba(255,255,255,${0.9 * flash})`);
      fg.addColorStop(0.3, `rgba(190,215,255,${0.4 * flash})`);
      fg.addColorStop(1, 'rgba(190,215,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, cy, fr, 0, Math.PI * 2);
      ctx.fill();

      const debris = 14;
      for (let i = 0; i < debris; i++) {
        const da = (Math.PI * 2 * i) / debris + t * 2;
        const dd = flash * R * 0.7 + Math.sin(t * 7 + i) * 4;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(da) * dd, cy + Math.sin(da) * dd * 0.7, pr * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.6})`;
        ctx.fill();
      }
    }

    // Inner vignette for depth
    const vg = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${0.55 * z})`);
    ctx.fillStyle = vg;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ── Lens rim (outside the clip) ──
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.18 * z})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, R + 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(170,200,255,${0.08 * z})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  const onMove = useCallback((e) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    mouse.current.tx = e.clientX - r.left;
    mouse.current.ty = e.clientY - r.top;
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 pointer-events-auto"
      onMouseMove={onMove}
      onMouseEnter={() => {
        hover.current = true;
      }}
      onMouseLeave={() => {
        hover.current = false;
        mouse.current.tx = -500;
        mouse.current.ty = -500;
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default AcceleratorMask;
