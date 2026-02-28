/**
 * LHC-style Particle Accelerator — Clean 3D Perspective Ring
 *
 * Minimal, elegant, professional. A tilted elliptical ring viewed in
 * 3D perspective with two counter-rotating particle beams. Clean and
 * uncluttered — lets the ring and particles speak for themselves.
 */

class ParticleAccelerator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.cx = 0;
    this.cy = 0;

    // 3D ring parameters
    this.ringRadiusX = 0;   // horizontal radius (wider)
    this.ringRadiusY = 0;   // vertical radius (compressed for 3D tilt)
    this.tilt = 0.55;       // perspective tilt factor (0=flat, 1=circle)

    // Particles
    this.beamA = [];
    this.beamB = [];
    this.stars = [];
    this.bursts = [];
    this.shockwaves = [];

    // Mouse
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.targetMX = -1000;
    this.targetMY = -1000;
    this.isHovering = false;

    // Timing
    this.animId = null;
    this.lastTime = 0;
    this.elapsed = 0;
    this.collisionTimer = 0;
    this.collisionInterval = 6000;

    this.isMobile = window.innerWidth < 768;
  }

  // Get 3D-projected position on the ring
  _ringPos(angle) {
    return {
      x: this.cx + Math.cos(angle) * this.ringRadiusX,
      y: this.cy + Math.sin(angle) * this.ringRadiusY,
      depth: Math.sin(angle), // -1 (back) to 1 (front)
    };
  }

  init() {
    this.resize();
    this._createStars();
    this._createBeam(this.beamA, 1);
    this._createBeam(this.beamB, -1);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.ringRadiusX = Math.min(this.width, this.height) * 0.35;
    this.ringRadiusY = this.ringRadiusX * this.tilt;
    this.isMobile = window.innerWidth < 768;
  }

  _createStars() {
    const count = this.isMobile ? 60 : 150;
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1 + 0.3,
        baseOpacity: Math.random() * 0.25 + 0.03,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.01,
      });
    }
  }

  _createBeam(arr, dir) {
    arr.length = 0;
    const count = this.isMobile ? 18 : 35;
    for (let i = 0; i < count; i++) {
      arr.push({
        angle: (Math.PI * 2 * i) / count,
        speed: (0.006 + Math.random() * 0.003) * dir,
        baseSpeed: (0.006 + Math.random() * 0.003) * dir,
        size: 0.8 + Math.random() * 0.8,
        opacity: 0.6 + Math.random() * 0.4,
        trail: [],
        trailMax: this.isMobile ? 8 : 14,
      });
    }
  }

  _triggerCollision(angle) {
    const pos = this._ringPos(angle);
    const count = this.isMobile ? 15 : 35;

    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.3 + Math.random() * 3;
      this.bursts.push({
        x: pos.x, y: pos.y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.7, // squish vertically for perspective
        life: 1,
        decay: 0.01 + Math.random() * 0.015,
        size: 0.3 + Math.random() * 1.2,
      });
    }

    this.shockwaves.push({
      x: pos.x, y: pos.y,
      radius: 0, maxRadius: 60 + Math.random() * 30,
      life: 1, decay: 0.02,
    });
  }

  update(dt) {
    this.elapsed += dt;

    // Smooth mouse
    this.mouseX += (this.targetMX - this.mouseX) * 0.06;
    this.mouseY += (this.targetMY - this.mouseY) * 0.06;

    // Beams
    const updateBeam = (beam) => {
      for (const p of beam) {
        if (this.isHovering) {
          const pos = this._ringPos(p.angle);
          const dx = this.mouseX - pos.x;
          const dy = this.mouseY - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            p.speed = p.baseSpeed * (1 + (1 - dist / 100) * 0.8);
          } else {
            p.speed += (p.baseSpeed - p.speed) * 0.03;
          }
        } else {
          p.speed += (p.baseSpeed - p.speed) * 0.03;
        }

        p.angle += p.speed;
        const pos = this._ringPos(p.angle);
        p.trail.push({ x: pos.x, y: pos.y, depth: pos.depth });
        if (p.trail.length > p.trailMax) p.trail.shift();
      }
    };
    updateBeam(this.beamA);
    updateBeam(this.beamB);

    // Collision
    this.collisionTimer += dt;
    if (this.collisionTimer >= this.collisionInterval) {
      this.collisionTimer = 0;
      this._triggerCollision(-Math.PI / 2 + (Math.random() - 0.5) * 0.4);
    }

    // Bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx; b.y += b.vy;
      b.vx *= 0.98; b.vy *= 0.98;
      b.life -= b.decay;
      if (b.life <= 0) this.bursts.splice(i, 1);
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += 1.2;
      s.life -= s.decay;
      if (s.life <= 0) this.shockwaves.splice(i, 1);
    }

    // Stars
    for (const s of this.stars) s.phase += s.speed;
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, this.width, this.height);

    // Stars
    for (const s of this.stars) {
      const o = s.baseOpacity + Math.sin(s.phase) * s.baseOpacity * 0.4;
      if (o < 0.01) continue;
      ctx.globalAlpha = o;
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // ── Draw back half of ring (behind content) ──
    this._drawRingArc(Math.PI * 0.05, Math.PI * 0.95, 0.025); // bottom arc (back)

    // ── Draw back-half beam particles ──
    this._drawBeamParticles(this.beamA, true);
    this._drawBeamParticles(this.beamB, true);

    // ── Draw front half of ring ──
    this._drawRingArc(-Math.PI * 0.95, Math.PI * 0.05, 0.05); // top arc (front)

    // ── Draw front-half beam particles ──
    this._drawBeamParticles(this.beamA, false);
    this._drawBeamParticles(this.beamB, false);

    // Shockwaves
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.radius, s.radius * this.tilt, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${s.life * 0.12})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Bursts
    for (const b of this.bursts) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 3);
      grad.addColorStop(0, `rgba(255,255,255,${b.life * 0.7})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouse glow near ring
    if (this.isHovering) {
      // Find closest point on ring to mouse
      const angle = Math.atan2(
        (this.mouseY - this.cy) / this.ringRadiusY,
        (this.mouseX - this.cx) / this.ringRadiusX
      );
      const closest = this._ringPos(angle);
      const dx = this.mouseX - closest.x;
      const dy = this.mouseY - closest.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 60) {
        const intensity = (1 - dist / 60) * 0.08;
        const grad = ctx.createRadialGradient(
          this.mouseX, this.mouseY, 0,
          this.mouseX, this.mouseY, 40
        );
        grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.mouseX, this.mouseY, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawRingArc(startAngle, endAngle, alpha) {
    const ctx = this.ctx;
    const steps = 120;
    const range = endAngle - startAngle;

    // Main ring path
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (range * i) / steps;
      const pos = this._ringPos(angle);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner ring (tube effect)
    const inset = 0.94;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (range * i) / steps;
      const x = this.cx + Math.cos(angle) * this.ringRadiusX * inset;
      const y = this.cy + Math.sin(angle) * this.ringRadiusY * inset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.4})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Outer ring
    const outset = 1.06;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (range * i) / steps;
      const x = this.cx + Math.cos(angle) * this.ringRadiusX * outset;
      const y = this.cy + Math.sin(angle) * this.ringRadiusY * outset;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  _drawBeamParticles(beam, backHalf) {
    const ctx = this.ctx;

    for (const p of beam) {
      const trail = p.trail;
      if (trail.length < 2) continue;
      const head = trail[trail.length - 1];

      // Filter: back half = depth > 0 (bottom of ellipse), front = depth <= 0
      const isBack = head.depth > 0;
      if (backHalf !== isBack) continue;

      // Depth-based sizing: particles in back are smaller/dimmer
      const depthFactor = backHalf ? 0.5 + (1 - head.depth) * 0.3 : 0.7 + (-head.depth) * 0.3;
      const size = p.size * depthFactor;
      const alpha = p.opacity * depthFactor;

      // Trail
      for (let i = 1; i < trail.length; i++) {
        const progress = i / trail.length;
        const tAlpha = progress * 0.2 * alpha;
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(255,255,255,${tAlpha})`;
        ctx.lineWidth = size * progress * 0.6;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Glow
      const glowR = size * 3;
      const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowR);
      grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
      grad.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.15})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(head.x, head.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(head.x, head.y, size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
    }
  }

  onMouseMove(x, y) { this.targetMX = x; this.targetMY = y; }
  onMouseEnter() { this.isHovering = true; }
  onMouseLeave() { this.isHovering = false; this.targetMX = -1000; this.targetMY = -1000; }

  animate = (ts) => {
    const dt = Math.min(ts - this.lastTime, 50);
    this.lastTime = ts;
    this.update(dt);
    this.draw();
    this.animId = requestAnimationFrame(this.animate);
  };

  start() { this.lastTime = performance.now(); this.animId = requestAnimationFrame(this.animate); }
  stop() { if (this.animId) cancelAnimationFrame(this.animId); }
  destroy() { this.stop(); this.beamA = []; this.beamB = []; this.stars = []; this.bursts = []; this.shockwaves = []; }
}

export default ParticleAccelerator;
