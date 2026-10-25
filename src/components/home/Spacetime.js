import { useEffect, useRef, useState } from 'react';

/*
 * A small patch of spacetime where the photo used to be.
 * Two light masses orbit each other and pinch the grid; the pointer is a
 * heavier mass; a click (or tap) sends a ripple outward, like knocking on
 * the desk in CHRONOS/AEON.
 */
const Spacetime = ({ className = '' }) => {
  const ref = useRef(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    let frame = 0;
    let ink = '37,36,33';
    const pointer = { x: 0, y: 0, active: false, m: 0 };
    const ripples = [];
    const start = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const readInk = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '37 36 33';
      ink = v.split(/\s+/).join(',');
    };

    const bend = (x, y, now, bodies) => {
      let dx = 0;
      let dy = 0;
      for (const b of bodies) {
        const rx = b.x - x;
        const ry = b.y - y;
        const k = Math.min((b.m * 380) / (rx * rx + ry * ry + b.soft), 0.85);
        dx += rx * k;
        dy += ry * k;
      }
      for (const r of ripples) {
        const age = (now - r.t) / 1000;
        const rx = x - r.x;
        const ry = y - r.y;
        const d = Math.hypot(rx, ry) || 1;
        const front = d - age * 95;
        const a = 6 * Math.sin(front * 0.35) * Math.exp(-(front * front) / 392) * Math.exp(-age * 1.3);
        dx += (rx / d) * a;
        dy += (ry / d) * a;
      }
      return [x + dx, y + dy];
    };

    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden || !w) return;
      frame += 1;
      if (frame % 60 === 1) readInk();

      const t = reduce ? 0 : (now - start) / 1000;
      while (ripples.length && now - ripples[0].t > 3500) ripples.shift();
      pointer.m += ((pointer.active ? 1 : 0) - pointer.m) * 0.12;

      const cx = w / 2;
      const cy = h * 0.54;
      const orbit = Math.min(w, h) * 0.1;
      const bodies = [
        { x: cx + Math.cos(t * 1.1) * orbit, y: cy + Math.sin(t * 1.1) * orbit, m: 0.3, soft: 40 },
        { x: cx - Math.cos(t * 1.1) * orbit, y: cy - Math.sin(t * 1.1) * orbit, m: 0.3, soft: 40 },
      ];
      if (pointer.m > 0.01) bodies.push({ x: pointer.x, y: pointer.y, m: pointer.m, soft: 70 });

      ctx.clearRect(0, 0, w, h);
      const gap = Math.max(9, Math.min(w, h) / 13);
      const step = gap / 2;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${ink},0.24)`;
      ctx.beginPath();
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = -gap; x <= w + gap; x += step) {
          const [px, py] = bend(x, y, now, bodies);
          if (x === -gap) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      for (let x = gap / 2; x < w; x += gap) {
        for (let y = -gap; y <= h + gap; y += step) {
          const [px, py] = bend(x, y, now, bodies);
          if (y === -gap) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      ctx.fillStyle = `rgba(${ink},0.9)`;
      bodies.slice(0, 2).forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      if (pointer.m > 0.05) {
        ctx.fillStyle = `rgba(${ink},${0.9 * pointer.m})`;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const local = (e) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onMove = (e) => {
      [pointer.x, pointer.y] = local(e);
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e) => {
      const [x, y] = local(e);
      ripples.push({ x, y, t: performance.now() });
      if (ripples.length > 6) ripples.shift();
      setTouched(true);
    };

    resize();
    readInk();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-md border border-line bg-sunk/50 ${className}`}>
      <canvas
        ref={ref}
        role="img"
        aria-label="A patch of spacetime. Move over it to bend it, click to send a ripple."
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
      />
      <span
        className={`hidden sm:block absolute left-2 bottom-1.5 font-mono text-[9.5px] tracking-wide text-ink-3 pointer-events-none transition-opacity duration-700 ${
          touched ? 'opacity-0' : 'opacity-100'
        }`}
      >
        poke spacetime
      </span>
    </div>
  );
};

export default Spacetime;
