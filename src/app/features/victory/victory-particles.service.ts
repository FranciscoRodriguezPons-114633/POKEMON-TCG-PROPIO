import { Injectable } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  hue: number;
  isDiamond: boolean;
  size: number;
  rot: number;
  rotSpeed: number;
  gravity: number;
  radius?: number;
}

@Injectable({ providedIn: 'root' })
export class VictoryParticlesService {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private frameId = 0;
  private frame = 0;
  private resizeObserver?: ResizeObserver;

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') ?? undefined;
    if (!this.ctx) {
      return;
    }

    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.loop();
  }

  burst(cx?: number, cy?: number): void {
    const canvas = this.canvas;
    if (!canvas) {
      return;
    }

    const x = cx ?? canvas.width / 2;
    const y = cy ?? canvas.height / 2;
    for (let index = 0; index < 80; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (1 + Math.random() * 4),
        life: 1,
        decay: 0.008 + Math.random() * 0.018,
        hue: Math.random() * 60,
        isDiamond: Math.random() < 0.4,
        size: 5 + Math.random() * 12,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        gravity: 0.12
      });
    }
  }

  levelUpBurst(): void {
    const canvas = this.canvas;
    if (!canvas) {
      return;
    }

    for (let index = 0; index < 40; index += 1) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 3,
        vy: 1 + Math.random() * 3,
        life: 1,
        decay: 0.005 + Math.random() * 0.01,
        hue: 260 + Math.random() * 40,
        isDiamond: true,
        size: 4 + Math.random() * 8,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        gravity: 0.05
      });
    }
  }

  destroy(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver?.disconnect();
    this.particles = [];
    this.canvas = undefined;
    this.ctx = undefined;
  }

  private resize(): void {
    const canvas = this.canvas;
    if (!canvas) {
      return;
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  private drizzle(): void {
    const canvas = this.canvas;
    if (!canvas || this.frame % 4 !== 0) {
      return;
    }

    for (let index = 0; index < 2; index += 1) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 1.5 + Math.random() * 2.5,
        life: 1,
        decay: 0.004 + Math.random() * 0.007,
        hue: 20 + Math.random() * 30,
        isDiamond: Math.random() < 0.5,
        size: 4 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        gravity: 0.04
      });
    }
  }

  private loop = (): void => {
    const canvas = this.canvas;
    const ctx = this.ctx;
    if (!canvas || !ctx) {
      return;
    }

    this.frameId = requestAnimationFrame(this.loop);
    if (document.hidden) {
      return;
    }

    this.frame += 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drizzle();

    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.vx *= 0.99;
      particle.life -= particle.decay;
      particle.rot += particle.rotSpeed;

      if (particle.life <= 0 || particle.y > canvas.height + 20) {
        this.particles.splice(index, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.pow(particle.life, 0.7);
      if (particle.isDiamond) {
        this.drawDiamond(ctx, particle);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius ?? particle.size * 0.4 * particle.life, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue}, 100%, 68%, 1)`;
        ctx.fill();
      }
      ctx.restore();
    }
  };

  private drawDiamond(ctx: CanvasRenderingContext2D, particle: Particle): void {
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rot);
    const size = particle.size * particle.life;
    const gradient = ctx.createLinearGradient(-size, -size, size, size);
    gradient.addColorStop(0, `hsla(${particle.hue + 180}, 90%, 85%, 1)`);
    gradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 65%, 1)`);
    gradient.addColorStop(1, `hsla(${particle.hue + 60}, 80%, 55%, 1)`);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.6, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.6, 0);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}
