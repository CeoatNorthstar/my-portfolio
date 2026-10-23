import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/*
 * Small things for curious visitors:
 *  - a proper-time clock that slows down when the pointer moves fast
 *  - the Konami code draws a bubble-chamber event
 *  - typing "tachyon" sends one across the screen
 *  - a note in the console
 */

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

const isTyping = (el) =>
  el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

const inkColor = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '37 36 33';
  return v.split(/\s+/).join(',');
};

const fullCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.className = 'egg-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { canvas, ctx };
};

// Charged tracks curling in a magnetic field, drawn as bubbles.
const bubbleChamber = () => {
  const { canvas, ctx } = fullCanvas();
  const rgb = inkColor();
  const cx = window.innerWidth * (0.35 + Math.random() * 0.3);
  const cy = window.innerHeight * (0.35 + Math.random() * 0.3);
  const tracks = Array.from({ length: 16 }, () => ({
    x: cx,
    y: cy,
    a: Math.random() * Math.PI * 2,
    v: 2 + Math.random() * 3,
    k: (Math.random() < 0.5 ? -1 : 1) * (0.004 + Math.random() * 0.02),
    life: 140 + Math.random() * 160,
  }));
  let frame = 0;
  let raf;
  const step = () => {
    frame += 1;
    tracks.forEach((t) => {
      if (t.life <= 0) return;
      for (let i = 0; i < 3; i += 1) {
        t.x += Math.cos(t.a) * t.v;
        t.y += Math.sin(t.a) * t.v;
        t.a += t.k;
        t.k *= 1.012; // losing energy, curling tighter
        t.v *= 0.996;
        t.life -= 1;
        ctx.fillStyle = `rgba(${rgb},${0.18 + Math.random() * 0.35})`;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 0.6 + Math.random() * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    if (frame < 120) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  canvas.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 4200, easing: 'ease-out' })
    .finished.then(() => {
      cancelAnimationFrame(raf);
      canvas.remove();
    });
};

// A faster-than-light streak, right to left.
const tachyon = () => {
  const { canvas, ctx } = fullCanvas();
  const rgb = inkColor();
  const w = window.innerWidth;
  const y = window.innerHeight * (0.2 + Math.random() * 0.6);
  const start = performance.now();
  const step = (now) => {
    const t = (now - start) / 380;
    ctx.clearRect(0, 0, w, window.innerHeight);
    const head = w + 40 - t * (w + 400);
    const grad = ctx.createLinearGradient(head, y, head + 320, y);
    grad.addColorStop(0, `rgba(${rgb},0.9)`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(head, y);
    ctx.lineTo(head + 320, y);
    ctx.stroke();
    if (t < 1) requestAnimationFrame(step);
    else canvas.remove();
  };
  requestAnimationFrame(step);
};

// Proper time: dτ = dt / γ, with the pointer's speed standing in for v.
const ProperTime = () => {
  const [tau, setTau] = useState(0);
  const [beta, setBeta] = useState(0);
  const speed = useRef(0);
  const last = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const now = performance.now();
      if (last.current) {
        const dt = Math.max(1, now - last.current.t);
        const v = Math.hypot(e.clientX - last.current.x, e.clientY - last.current.y) / dt;
        speed.current = Math.max(speed.current, v);
      }
      last.current = { x: e.clientX, y: e.clientY, t: now };
    };
    let prev = performance.now();
    let b = 0;
    let acc = 0;
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - prev) / 1000;
      prev = now;
      const target = Math.min(0.995, speed.current / 4);
      b += (target - b) * 0.25;
      speed.current *= 0.6;
      acc += dt * Math.sqrt(1 - b * b);
      setTau(acc);
      setBeta(b);
    }, 100);
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      clearInterval(id);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const mm = String(Math.floor(tau / 60)).padStart(2, '0');
  const ss = (tau % 60).toFixed(1).padStart(4, '0');
  return (
    <div
      className="fixed bottom-[5px] right-6 z-40 hidden md:block font-mono text-[10.5px] text-ink-3 select-none tabular-nums"
      title="Your proper time on this page. Move faster and it runs slower."
    >
      {'τ'} {mm}:{ss}
      <span className={`ml-2 transition-opacity duration-500 ${beta > 0.2 ? 'opacity-100' : 'opacity-0'}`}>
        v = {beta.toFixed(2)}c
      </span>
    </div>
  );
};

let greeted = false;

const Eggs = () => {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const say = useCallback((text) => {
    clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    if (!greeted) {
      greeted = true;
      // eslint-disable-next-line no-console
      console.log(
        '%cHello, observer.',
        'font: 500 16px Newsreader, Georgia, serif;',
        '\nA few things on this site only show up for people who look. Try the Konami code, or type a particle that should not exist.'
      );
    }
    let keys = [];
    let typed = '';
    let events = 0;
    const onKey = (e) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      keys = [...keys, e.key].slice(-KONAMI.length);
      if (KONAMI.every((k, i) => k.toLowerCase() === (keys[i] || '').toLowerCase())) {
        keys = [];
        events += 1;
        bubbleChamber();
        say(`Collision recorded. Event #${String(events).padStart(4, '0')}.`);
      }
      if (e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-7);
        if (typed === 'tachyon') {
          typed = '';
          say('It arrived before you finished typing.');
          setTimeout(tachyon, 250);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [say]);

  return (
    <>
      <ProperTime />
      <div className="fixed bottom-5 inset-x-0 z-[80] flex justify-center pointer-events-none">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-4 py-2 rounded-md bg-ink text-canvas font-mono text-[11.5px]"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Eggs;
