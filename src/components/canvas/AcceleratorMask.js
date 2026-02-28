import { useRef, useEffect, useCallback } from 'react';

/**
 * LHC Mask — when hovering near the accelerator ring, a lens appears
 * that lets you "look inside" the tube. Inside you see two particle
 * beams converging and colliding. The mask only activates near the ring.
 *
 * All rendering via direct DOM/canvas manipulation for 60fps.
 */
const AcceleratorMask = ({ ringRadiusX, ringRadiusY, centerX, centerY }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskRef = useRef(null);
  const animRef = useRef(null);
  const mouse = useRef({ x: -500, y: -500, tx: -500, ty: -500 });
  const hover = useRef(false);
  const active = useRef(false);
  const time = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask) return;
    const ctx = canvas.getContext('2d');
    const m = mouse.current;
    const t = time.current;

    // Smooth interpolation
    m.x += (m.tx - m.x) * 0.1;
    m.y += (m.ty - m.y) * 0.1;

    // Check if mouse is near the ring
    const container = containerRef.current;
    if (!container) { animRef.current = requestAnimationFrame(draw); return; }
    const rect = container.getBoundingClientRect();
    const cxLocal = rect.width / 2;
    const cyLocal = rect.height / 2;
    const rxLocal = Math.min(rect.width, rect.height) * 0.35;
    const ryLocal = rxLocal * 0.55;

    // Distance from mouse to nearest point on ellipse
    const angle = Math.atan2((m.y - cyLocal) / ryLocal, (m.x - cxLocal) / rxLocal);
    const nearX = cxLocal + Math.cos(angle) * rxLocal;
    const nearY = cyLocal + Math.sin(angle) * ryLocal;
    const dist = Math.sqrt((m.x - nearX) ** 2 + (m.y - nearY) ** 2);

    const shouldBeActive = hover.current && dist < 50;

    if (shouldBeActive && !active.current) active.current = true;
    if (!shouldBeActive && active.current) active.current = false;

    // Update mask
    const maskOpacity = active.current ? 1 : 0;
    mask.style.opacity = maskOpacity;
    mask.style.clipPath = `circle(70px at ${m.x}px ${m.y}px)`;

    if (!active.current) {
      time.current += 0.016;
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Interior of the accelerator tube
    ctx.fillStyle = '#010101';
    ctx.fillRect(0, 0, w, h);

    const cx = m.x;
    const cy = m.y;

    // Circular tube walls (concentric rings)
    for (let r = 65; r > 10; r -= 8) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${0.015 + (65 - r) * 0.001})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Cross-hatch structure inside tube
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 + t * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10);
      ctx.lineTo(cx + Math.cos(a) * 65, cy + Math.sin(a) * 65);
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Two particle beams converging
    const cycle = Math.abs(Math.sin(t * 1.5));
    const separation = (1 - cycle) * 50 + 3;
    const colliding = cycle > 0.95;

    // Beam A (left)
    for (let i = 0; i < 6; i++) {
      const progress = i / 6;
      const bx = cx - separation - i * 8;
      const by = cy + Math.sin(t * 4 + i * 0.4) * 1.5;
      const s = 1.8 - progress;
      const a = (1 - progress) * 0.8;

      const g = ctx.createRadialGradient(bx, by, 0, bx, by, s * 4);
      g.addColorStop(0, `rgba(255,255,255,${a * 0.5})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, s * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, s * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }

    // Beam B (right)
    for (let i = 0; i < 6; i++) {
      const progress = i / 6;
      const bx = cx + separation + i * 8;
      const by = cy + Math.sin(t * 4 + i * 0.4 + Math.PI) * 1.5;
      const s = 1.8 - progress;
      const a = (1 - progress) * 0.8;

      const g = ctx.createRadialGradient(bx, by, 0, bx, by, s * 4);
      g.addColorStop(0, `rgba(255,255,255,${a * 0.5})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, s * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, s * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
    }

    // Collision
    if (colliding) {
      const flash = (cycle - 0.95) / 0.05;
      const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * flash);
      fg.addColorStop(0, `rgba(255,255,255,${flash * 0.7})`);
      fg.addColorStop(0.3, `rgba(200,220,255,${flash * 0.25})`);
      fg.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fill();

      // Debris
      for (let i = 0; i < 10; i++) {
        const da = (Math.PI * 2 * i) / 10 + t * 3;
        const dd = flash * 30 + Math.sin(t * 6 + i * 2) * 5;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(da) * dd, cy + Math.sin(da) * dd, 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.4})`;
        ctx.fill();
      }
    }

    // Lens border glow
    const lg = ctx.createRadialGradient(cx, cy, 55, cx, cy, 72);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(cx, cy, 72, 0, Math.PI * 2);
    ctx.fill();

    time.current += 0.016;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const r = container.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };

    resize();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
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
      onMouseEnter={() => { hover.current = true; }}
      onMouseLeave={() => { hover.current = false; active.current = false; mouse.current.tx = -500; mouse.current.ty = -500; }}
    >
      <div
        ref={maskRef}
        className="absolute inset-0"
        style={{ opacity: 0, clipPath: 'circle(70px at -500px -500px)', transition: 'opacity 0.3s', willChange: 'clip-path, opacity' }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

export default AcceleratorMask;
