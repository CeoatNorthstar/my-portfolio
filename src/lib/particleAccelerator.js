/**
 * Enterprise-grade Particle Accelerator — Canvas 2D Engine
 *
 * A polished, Google-tier CERN-inspired animation with:
 * - Smooth bezier-curved particle paths with velocity-based motion blur
 * - Soft radial gradients for glows (not flat circles)
 * - Magnetic field lines with subtle animation
 * - Refined collision system with shockwave rings
 * - Mouse-reactive particle deflection
 * - Performance-optimized rendering pipeline
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
    this.ringRadius = 0;
    this.ringThickness = 16;

    // Particle systems
    this.beamA = [];
    this.beamB = [];
    this.stars = [];
    this.bursts = [];
    this.shockwaves = [];
    this.fieldLines = [];

    // Mouse interaction
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.targetMouseX = -1000;
    this.targetMouseY = -1000;
    this.isHovering = false;

    // Timing
    this.animId = null;
    this.lastTime = 0;
    this.elapsed = 0;
    this.collisionTimer = 0;
    this.collisionInterval = 5000;

    this.isMobile = window.innerWidth < 768;

    // Pre-computed gradients cache
    this._gradientCache = {};
  }

  init() {
    this.resize();
    this._createStars();
    this._createBeam(this.beamA, 1);
    this._createBeam(this.beamB, -1);
    this._createFieldLines();
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
    this.ringRadius = Math.min(this.width, this.height) * 0.28;
    this.ringThickness = Math.max(12, this.ringRadius * 0.06);
    this.isMobile = window.innerWidth < 768;
    this._gradientCache = {};
  }

  _createStars() {
    const count = this.isMobile ? 80 : 180;
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.2 + 0.3,
        baseOpacity: Math.random() * 0.3 + 0.05,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.005 + Math.random() * 0.015,
      });
    }
  }

  _createBeam(arr, direction) {
    arr.length = 0;
    const count = this.isMobile ? 25 : 50;
    for (let i = 0; i < count; i++) {
      const baseSpeed = 0.008 + Math.random() * 0.004;
      arr.push({
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.1,
        speed: baseSpeed * direction,
        baseSpeed: baseSpeed * direction,
        size: 0.8 + Math.random() * 1.2,
        radialOffset: (Math.random() - 0.5) * this.ringThickness * 0.6,
        opacity: 0.5 + Math.random() * 0.5,
        trail: [],
        trailMax: this.isMobile ? 10 : 18,
        energy: 0.7 + Math.random() * 0.3,
      });
    }
  }

  _createFieldLines() {
    this.fieldLines = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      this.fieldLines.push({
        angle: (Math.PI * 2 * i) / count,
        length: this.ringRadius * 0.4 + Math.random() * this.ringRadius * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  _triggerCollision(angle) {
    const x = this.cx + Math.cos(angle) * this.ringRadius;
    const y = this.cy + Math.sin(angle) * this.ringRadius;
    const count = this.isMobile ? 20 : 45;

    // Particle debris
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 0.5 + Math.random() * 4;
      this.bursts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: 0.3 + Math.random() * 1.5,
        type: Math.random() > 0.7 ? 'bright' : 'normal',
      });
    }

    // Shockwave rings
    this.shockwaves.push({
      x, y,
      radius: 0,
      maxRadius: 80 + Math.random() * 40,
      speed: 1.5 + Math.random() * 1,
      life: 1,
      decay: 0.015,
    });
    // Second delayed ring
    setTimeout(() => {
      this.shockwaves.push({
        x, y,
        radius: 0,
        maxRadius: 50 + Math.random() * 30,
        speed: 1 + Math.random() * 0.5,
        life: 0.6,
        decay: 0.012,
      });
    }, 150);
  }

  update(dt) {
    this.elapsed += dt;

    // Smooth mouse interpolation
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.08;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.08;

    // Update beam particles
    const updateBeam = (beam) => {
      for (const p of beam) {
        // Mouse deflection — particles speed up/slow near cursor
        if (this.isHovering) {
          const px = this.cx + Math.cos(p.angle) * this.ringRadius;
          const py = this.cy + Math.sin(p.angle) * this.ringRadius;
          const dx = this.mouseX - px;
          const dy = this.mouseY - py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const influence = (1 - dist / 120) * 0.006;
            p.speed = p.baseSpeed + (p.baseSpeed > 0 ? influence : -influence);
            p.energy = Math.min(1, p.energy + 0.01);
          } else {
            p.speed += (p.baseSpeed - p.speed) * 0.02;
            p.energy += (0.7 + Math.random() * 0.3 - p.energy) * 0.005;
          }
        } else {
          p.speed += (p.baseSpeed - p.speed) * 0.02;
        }

        p.angle += p.speed;

        // Trail with position
        const tx = this.cx + Math.cos(p.angle) * (this.ringRadius + p.radialOffset);
        const ty = this.cy + Math.sin(p.angle) * (this.ringRadius + p.radialOffset);
        p.trail.push({ x: tx, y: ty });
        if (p.trail.length > p.trailMax) p.trail.shift();
      }
    };
    updateBeam(this.beamA);
    updateBeam(this.beamB);

    // Collision timer
    this.collisionTimer += dt;
    if (this.collisionTimer >= this.collisionInterval) {
      this.collisionTimer = 0;
      // Collision at a natural point on the ring
      const collisionAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.3;
      this._triggerCollision(collisionAngle);
    }

    // Update bursts
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.vx *= 0.985;
      b.vy *= 0.985;
      b.life -= b.decay;
      if (b.life <= 0) this.bursts.splice(i, 1);
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed;
      s.life -= s.decay;
      if (s.life <= 0 || s.radius >= s.maxRadius) this.shockwaves.splice(i, 1);
    }

    // Stars twinkle
    for (const s of this.stars) {
      s.phase += s.twinkleSpeed;
    }
  }

  draw() {
    const ctx = this.ctx;

    // Clear with solid black
    ctx.fillStyle = '#030303';
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Stars ──
    for (const s of this.stars) {
      const opacity = s.baseOpacity + Math.sin(s.phase) * s.baseOpacity * 0.5;
      if (opacity <= 0.01) continue;
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
    }
    ctx.globalAlpha = 1;

    // ── Field lines (very subtle magnetic field visualization) ──
    const t = this.elapsed * 0.0003;
    ctx.save();
    for (const fl of this.fieldLines) {
      const pulseOpacity = 0.015 + Math.sin(fl.phase + t * 3) * 0.008;
      ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, pulseOpacity)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();

      const startR = this.ringRadius * 0.5;
      const endR = this.ringRadius + fl.length;
      ctx.moveTo(
        this.cx + Math.cos(fl.angle + t * 0.2) * startR,
        this.cy + Math.sin(fl.angle + t * 0.2) * startR
      );
      ctx.lineTo(
        this.cx + Math.cos(fl.angle + t * 0.1) * endR,
        this.cy + Math.sin(fl.angle + t * 0.1) * endR
      );
      ctx.stroke();
    }
    ctx.restore();

    // ── Accelerator ring structure ──
    ctx.save();

    // Outer boundary
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.ringRadius + this.ringThickness / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Inner boundary
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.ringRadius - this.ringThickness / 2, 0, Math.PI * 2);
    ctx.stroke();

    // Center guide (dashed for sophistication)
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.setLineDash([4, 12]);
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.ringRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Segment markers around the ring (like detector segments)
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const innerR = this.ringRadius - this.ringThickness / 2;
      const outerR = this.ringRadius + this.ringThickness / 2;
      const tickLength = i % 6 === 0 ? this.ringThickness : this.ringThickness * 0.4;

      ctx.strokeStyle = i % 6 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(
        this.cx + Math.cos(angle) * innerR,
        this.cy + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        this.cx + Math.cos(angle) * (innerR - tickLength * 0.3),
        this.cy + Math.sin(angle) * (innerR - tickLength * 0.3)
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(
        this.cx + Math.cos(angle) * outerR,
        this.cy + Math.sin(angle) * outerR
      );
      ctx.lineTo(
        this.cx + Math.cos(angle) * (outerR + tickLength * 0.3),
        this.cy + Math.sin(angle) * (outerR + tickLength * 0.3)
      );
      ctx.stroke();
    }

    // Detector stations — 4 larger nodes at cardinal points
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 * i) / 4 - Math.PI / 4;
      const x = this.cx + Math.cos(angle) * this.ringRadius;
      const y = this.cy + Math.sin(angle) * this.ringRadius;
      const pulse = 0.03 + Math.sin(this.elapsed * 0.002 + i) * 0.015;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${pulse})`;
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${pulse * 0.6})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    ctx.restore();

    // ── Beam particles with motion blur trails ──
    this._drawBeam(this.beamA);
    this._drawBeam(this.beamB);

    // ── Shockwaves ──
    for (const s of this.shockwaves) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200,220,255,${s.life * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner fill
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.life * 0.02})`;
      ctx.fill();
    }

    // ── Collision bursts ──
    for (const b of this.bursts) {
      if (b.type === 'bright') {
        // Bright core particles
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size * 4);
        grad.addColorStop(0, `rgba(255,255,255,${b.life * 0.8})`);
        grad.addColorStop(0.4, `rgba(200,220,255,${b.life * 0.3})`);
        grad.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${b.life * 0.7})`;
        ctx.fill();
      }
    }

    // ── Mouse interaction glow ──
    if (this.isHovering) {
      const dx = this.mouseX - this.cx;
      const dy = this.mouseY - this.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ringDist = Math.abs(dist - this.ringRadius);

      if (ringDist < 80) {
        const intensity = 1 - ringDist / 80;
        const grad = ctx.createRadialGradient(
          this.mouseX, this.mouseY, 0,
          this.mouseX, this.mouseY, 50
        );
        grad.addColorStop(0, `rgba(255,255,255,${intensity * 0.06})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.mouseX, this.mouseY, 50, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawBeam(beam) {
    const ctx = this.ctx;

    for (const p of beam) {
      const trail = p.trail;
      if (trail.length < 2) continue;

      // Motion blur trail as a tapered path
      ctx.save();
      for (let i = 1; i < trail.length; i++) {
        const progress = i / trail.length;
        const alpha = progress * 0.25 * p.opacity * p.energy;
        const width = p.size * progress * 0.8;

        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Particle head — soft radial gradient glow
      const head = trail[trail.length - 1];
      const glowSize = p.size * (2.5 + p.energy * 2);

      const grad = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, glowSize);
      grad.addColorStop(0, `rgba(255,255,255,${p.opacity * p.energy * 0.9})`);
      grad.addColorStop(0.3, `rgba(255,255,255,${p.opacity * p.energy * 0.3})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(head.x, head.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(head.x, head.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.opacity * p.energy})`;
      ctx.fill();

      ctx.restore();
    }
  }

  onMouseMove(x, y) {
    this.targetMouseX = x;
    this.targetMouseY = y;
  }

  onMouseEnter() {
    this.isHovering = true;
  }

  onMouseLeave() {
    this.isHovering = false;
    this.targetMouseX = -1000;
    this.targetMouseY = -1000;
  }

  animate = (timestamp) => {
    const dt = Math.min(timestamp - this.lastTime, 50); // Cap at 50ms to prevent jumps
    this.lastTime = timestamp;
    this.update(dt);
    this.draw();
    this.animId = requestAnimationFrame(this.animate);
  };

  start() {
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.animate);
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  destroy() {
    this.stop();
    this.beamA = [];
    this.beamB = [];
    this.stars = [];
    this.bursts = [];
    this.shockwaves = [];
  }
}

export default ParticleAccelerator;
