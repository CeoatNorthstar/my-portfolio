import { useRef, useEffect, useCallback } from 'react';

/**
 * Enterprise masking effect — a circular lens that follows the cursor,
 * revealing an alternate dimension inside: a close-up particle collision
 * with glowing beams, shockwaves, and energy discharge.
 *
 * Uses performant RAF loop with direct style mutation (no React state).
 */
const AcceleratorMask = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const maskRef = useRef(null);
  const animRef = useRef(null);
  const mouseRef = useRef({ x: -300, y: -300, targetX: -300, targetY: -300 });
  const hoverRef = useRef(false);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const mask = maskRef.current;
    if (!canvas || !mask) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const m = mouseRef.current;
    const t = timeRef.current;

    // Smooth mouse interpolation
    m.x += (m.targetX - m.x) * 0.12;
    m.y += (m.targetY - m.y) * 0.12;

    // Update clip-path
    const opacity = hoverRef.current ? 1 : 0;
    mask.style.opacity = opacity;
    mask.style.clipPath = `circle(90px at ${m.x}px ${m.y}px)`;

    if (!hoverRef.current && opacity < 0.01) {
      timeRef.current += 0.016;
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    ctx.clearRect(0, 0, w, h);

    // Deep black interior with subtle vignette
    ctx.fillStyle = '#010101';
    ctx.fillRect(0, 0, w, h);

    const cx = m.x;
    const cy = m.y;

    // Tube structure lines (horizontal, perspective)
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let i = -8; i <= 8; i++) {
      const yOff = i * 14;
      const wobble = Math.sin(t * 2 + i * 0.3) * 2;
      ctx.beginPath();
      ctx.moveTo(cx - 200, cy + yOff + wobble);
      ctx.lineTo(cx + 200, cy + yOff + wobble);
      ctx.stroke();
    }

    // Vertical structure lines
    for (let i = -6; i <= 6; i++) {
      const xOff = i * 20;
      ctx.beginPath();
      ctx.moveTo(cx + xOff, cy - 120);
      ctx.lineTo(cx + xOff, cy + 120);
      ctx.stroke();
    }

    // Two converging beams
    const cycleTime = t * 1.2;
    const convergence = Math.abs(Math.sin(cycleTime));
    const offset = (1 - convergence) * 100 + 5;
    const isColliding = convergence > 0.92;

    // Left beam
    const beamLength = 8;
    for (let i = 0; i < beamLength; i++) {
      const progress = i / beamLength;
      const bx = cx - offset - i * 15;
      const by = cy + Math.sin(t * 3 + i * 0.5) * 2;
      const size = 2 - progress * 1.2;
      const alpha = (1 - progress) * 0.7;

      // Glow
      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, size * 5);
      grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, size * 5, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Right beam
    for (let i = 0; i < beamLength; i++) {
      const progress = i / beamLength;
      const bx = cx + offset + i * 15;
      const by = cy + Math.sin(t * 3 + i * 0.5 + Math.PI) * 2;
      const size = 2 - progress * 1.2;
      const alpha = (1 - progress) * 0.7;

      const grad = ctx.createRadialGradient(bx, by, 0, bx, by, size * 5);
      grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.4})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, size * 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }

    // Collision flash
    if (isColliding) {
      const flash = (convergence - 0.92) / 0.08; // 0 to 1

      // Central flash gradient
      const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 * flash);
      flashGrad.addColorStop(0, `rgba(255,255,255,${flash * 0.6})`);
      flashGrad.addColorStop(0.2, `rgba(200,220,255,${flash * 0.3})`);
      flashGrad.addColorStop(0.5, `rgba(180,200,255,${flash * 0.1})`);
      flashGrad.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Energy spokes
      const spokeCount = 12;
      for (let i = 0; i < spokeCount; i++) {
        const angle = (Math.PI * 2 * i) / spokeCount + t * 2;
        const len = flash * 50 + Math.sin(t * 8 + i) * 10;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
        ctx.strokeStyle = `rgba(255,255,255,${flash * 0.2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Expanding shockwave ring
      const ringR = flash * 45;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,220,255,${(1 - flash) * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Ambient energy particles floating in the tube
    for (let i = 0; i < 15; i++) {
      const px = cx + Math.sin(t * 0.7 + i * 2.1) * 80;
      const py = cy + Math.cos(t * 0.5 + i * 1.7) * 60;
      const pAlpha = 0.05 + Math.sin(t + i) * 0.03;
      ctx.beginPath();
      ctx.arc(px, py, 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, pAlpha)})`;
      ctx.fill();
    }

    // Lens border (circular edge glow)
    const lensGrad = ctx.createRadialGradient(cx, cy, 70, cx, cy, 92);
    lensGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lensGrad.addColorStop(0.8, 'rgba(255,255,255,0)');
    lensGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 92, 0, Math.PI * 2);
    ctx.fill();

    timeRef.current += 0.016;
    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current.targetX = e.clientX - rect.left;
    mouseRef.current.targetY = e.clientY - rect.top;
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => {
        hoverRef.current = false;
        mouseRef.current.targetX = -300;
        mouseRef.current.targetY = -300;
      }}
    >
      <div
        ref={maskRef}
        className="absolute inset-0"
        style={{
          opacity: 0,
          clipPath: 'circle(90px at -300px -300px)',
          transition: 'opacity 0.4s ease-out',
          willChange: 'clip-path, opacity',
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    </div>
  );
};

export default AcceleratorMask;
