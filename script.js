// ── Cursor ──────────────────────────────────────────
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
  setTimeout(() => {
    trail.style.left = mx + 'px';
    trail.style.top = my + 'px';
  }, 80);
});

// ── Canvas Particle + Fluid System ──────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], mouseX = -9999, mouseY = -9999;

const COLORS = ['#ff2d78','#ff9500','#00e5ff','#b400ff','#00ff88','#ff6b35','#7b2fff'];

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); initParticles(); });

document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

class Particle {
  constructor() { this.reset(true); }
  reset(initial = false) {
    this.x = Math.random() * W;
    this.y = initial ? Math.random() * H : H + 20;
    this.size = Math.random() * 3 + 0.5;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = Math.random() * 0.6 + 0.1;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -(Math.random() * 0.8 + 0.2);
    this.life = 0;
    this.maxLife = Math.random() * 300 + 200;
    // fluid properties
    this.noiseOffset = Math.random() * 1000;
    this.speed = Math.random() * 0.5 + 0.2;
  }
  update(t) {
    // Perlin-like noise via sin/cos
    const n1 = Math.sin(this.x * 0.005 + t * 0.0008 + this.noiseOffset) * Math.cos(this.y * 0.004 + t * 0.0006);
    const n2 = Math.cos(this.x * 0.004 - t * 0.0007 + this.noiseOffset * 0.5) * Math.sin(this.y * 0.005 + t * 0.0009);
    this.vx += n1 * 0.08;
    this.vy += n2 * 0.06 - 0.01;

    // Mouse repel
    const dx = this.x - mouseX, dy = this.y - mouseY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.vx += (dx / dist) * force * 1.5;
      this.vy += (dy / dist) * force * 1.5;
    }

    this.vx *= 0.97;
    this.vy *= 0.97;
    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    if (this.x < -20 || this.x > W + 20 || this.y < -20 || this.life > this.maxLife) {
      this.reset();
    }
  }
  draw() {
    const lifeRatio = this.life / this.maxLife;
    const fade = lifeRatio < 0.1 ? lifeRatio * 10 : lifeRatio > 0.8 ? (1 - lifeRatio) * 5 : 1;
    ctx.save();
    ctx.globalAlpha = this.alpha * fade;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Connection lines
function drawConnections() {
  const MAX_DIST = 100;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < Math.min(i + 8, particles.length); j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < MAX_DIST) {
        const alpha = (1 - d / MAX_DIST) * 0.15;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = particles[i].color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function initParticles() {
  particles = [];
  const count = Math.min(Math.floor(W * H / 8000), 180);
  for (let i = 0; i < count; i++) particles.push(new Particle());
}
initParticles();

let t = 0;
function loop() {
  ctx.clearRect(0, 0, W, H);

  // Fluid background blobs
  const blobs = [
    { x: W * 0.2, y: H * 0.3, r: 300, c: 'rgba(255,45,120,0.04)' },
    { x: W * 0.8, y: H * 0.6, r: 250, c: 'rgba(0,229,255,0.05)' },
    { x: W * 0.5, y: H * 0.8, r: 200, c: 'rgba(180,0,255,0.04)' },
  ];
  blobs.forEach(b => {
    const ox = Math.sin(t * 0.0004 + b.x) * 40;
    const oy = Math.cos(t * 0.0003 + b.y) * 30;
    const grad = ctx.createRadialGradient(b.x+ox, b.y+oy, 0, b.x+ox, b.y+oy, b.r);
    grad.addColorStop(0, b.c);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });

  drawConnections();
  particles.forEach(p => { p.update(t); p.draw(); });
  t++;
  requestAnimationFrame(loop);
}
loop();

// ── Scroll reveal ────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('#about > *, .work-card, #contact > *').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(40px)';
  el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  observer.observe(el);
});