import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import gsap from 'gsap';
import { Subscription } from 'rxjs';
import { FxEvent, FxService } from '../../core/services/fx.service';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'triangle';
}

@Component({
  selector: 'app-fx-layer',
  imports: [CommonModule],
  templateUrl: './fx-layer.component.html',
  styleUrl: './fx-layer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FxLayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private animationFrame = 0;
  private subscription?: Subscription;
  private prefersReducedMotion = false;
  private documentHidden = typeof document !== 'undefined' ? document.hidden : false;
  private motionQuery?: MediaQueryList;
  private readonly activeStatusIntervals = new Map<string, ReturnType<typeof setInterval>>();

  constructor(
    private readonly fx: FxService,
    private readonly host: ElementRef<HTMLElement>
  ) {}

  ngAfterViewInit(): void {
    if (typeof CanvasRenderingContext2D === 'undefined') {
      return;
    }

    const context = this.canvasRef.nativeElement.getContext('2d');
    if (!context) {
      return;
    }

    this.ctx = context;
    this.resize();
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion = this.motionQuery.matches;
    this.motionQuery.addEventListener('change', this.handleMotionChange);
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.subscription = this.fx.events$.subscribe((event) => this.play(event));
    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.motionQuery?.removeEventListener('change', this.handleMotionChange);
    this.subscription?.unsubscribe();
    this.activeStatusIntervals.forEach((interval) => clearInterval(interval));
    cancelAnimationFrame(this.animationFrame);
  }

  private readonly handleMotionChange = (event: MediaQueryListEvent): void => {
    this.prefersReducedMotion = event.matches;
    if (event.matches) {
      this.particles = [];
    }
  };

  private readonly handleVisibilityChange = (): void => {
    this.documentHidden = document.hidden;
  };

  private readonly resize = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  private play(event: FxEvent): void {
    switch (event.type) {
      case 'damage':
        this.spawnNumber(event, '#ff5f6d');
        this.spawnParticles(event.x, event.y, '#ff5f6d', 30);
        break;
      case 'heal':
        this.spawnNumber(event, '#5dffae');
        this.spawnParticles(event.x, event.y, '#5dffae', 20);
        break;
      case 'draw':
        this.spawnNumber(event, '#ffd966');
        this.spawnParticles(event.x, event.y, '#ffd966', 15);
        break;
      case 'attack_start':
        this.pulseElement(event.elementId, 1.3);
        break;
      case 'attack_impact':
        this.handleAttackImpact(event);
        break;
      case 'energy_attach':
        this.glowElement(event.elementId);
        this.spawnParticles(event.x, event.y, '#00ffff', 18);
        break;
      case 'evolve':
        this.evolveAnimation(event.elementId);
        this.showLottie('assets/lottie/evolution.json', event.x, event.y);
        break;
      case 'retreat':
        this.spawnParticles(event.x, event.y, '#cccccc', 20);
        this.slideElement(event.elementId, 60);
        break;
      case 'ko':
        this.handleKo(event);
        break;
      case 'shake':
        this.shakeElement(event.elementId);
        break;
      case 'flash':
        this.flashScreen(0.2);
        break;
      case 'card_fly':
        if (typeof event.fromX === 'number' && typeof event.fromY === 'number' && event.cardId) {
          this.flyCard(event.fromX, event.fromY, event.x, event.y, event.cardId);
        }
        break;
      case 'status_effect':
        if (event.elementId && event.status && event.duration) {
          this.startStatusParticles(event.elementId, event.status, event.duration);
        }
        break;
    }
  }

  private handleAttackImpact(event: FxEvent): void {
    const lottieMap: Record<string, string> = {
      fire: 'assets/lottie/fire-explosion.json',
      water: 'assets/lottie/water-splash.json',
      lightning: 'assets/lottie/lightning-strike.json',
      psychic: 'assets/lottie/psychic-wave.json',
      grass: 'assets/lottie/leaf-storm.json',
      fighting: 'assets/lottie/fighting-punch.json'
    };
    const lottiePath = lottieMap[event.attackType?.toLowerCase() ?? ''] ?? 'assets/lottie/default-impact.json';
    this.showLottie(lottiePath, event.x, event.y);
    this.spawnParticles(event.x, event.y, '#ffffff', 42, event.attackType);
    this.flashScreen(0.25);
    this.zoomCamera(event.x, event.y);
    this.shakeElement(event.elementId);
  }

  private handleKo(event: FxEvent): void {
    this.showLottie('assets/lottie/explosion.json', event.x, event.y);
    this.spawnParticles(event.x, event.y, '#ff3b3b', 74);
    if (event.elementId) {
      const element = document.getElementById(event.elementId);
      if (element) {
        gsap.to(element, {
          opacity: 0,
          scale: 0.25,
          rotation: 180,
          duration: 0.6,
          ease: 'back.in',
          yoyo: true,
          repeat: 1,
          onComplete: () => gsap.set(element, { opacity: 1, scale: 1, rotation: 0 })
        });
      }
    }

    const darkOverlay = document.createElement('div');
    darkOverlay.className = 'fx-dark-overlay';
    document.body.appendChild(darkOverlay);
    gsap.to(darkOverlay, { opacity: 0.42, duration: 0.24, yoyo: true, repeat: 1, onComplete: () => darkOverlay.remove() });
    this.showKoText(event.x, event.y);
  }

  private flyCard(fromX: number, fromY: number, toX: number, toY: number, cardId: string): void {
    const originalImg = document.getElementById(`card-img-${cardId}`) as HTMLImageElement | null;
    if (!originalImg) {
      this.spawnParticles(toX, toY, '#ffd966', 12);
      return;
    }

    const clone = originalImg.cloneNode(true) as HTMLImageElement;
    clone.classList.add('fly-card');
    clone.style.left = `${fromX - 40}px`;
    clone.style.top = `${fromY - 50}px`;
    document.body.appendChild(clone);
    const midX = (toX - fromX) / 2;
    const midY = Math.min(toY - fromY, -120);
    gsap.to(clone, {
      keyframes: [
        { x: midX, y: midY, rotation: 180, scale: 0.82, duration: 0.36, ease: 'power2.out' },
        { x: toX - fromX, y: toY - fromY, rotation: 360, scale: 0.55, duration: 0.34, ease: 'back.out(1.4)' }
      ],
      onComplete: () => clone.remove()
    });
  }

  private startStatusParticles(elementId: string, status: string, duration: number): void {
    this.activeStatusIntervals.get(elementId) && clearInterval(this.activeStatusIntervals.get(elementId));
    const color = status === 'poison' ? '#8b00ff' : status === 'burn' ? '#ff4500' : '#aaaaaa';
    const interval = setInterval(() => {
      const element = document.getElementById(elementId);
      if (!element) {
        clearInterval(interval);
        this.activeStatusIntervals.delete(elementId);
        return;
      }
      const rect = element.getBoundingClientRect();
      this.spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, color, 6);
    }, 800);

    this.activeStatusIntervals.set(elementId, interval);
    window.setTimeout(() => {
      clearInterval(interval);
      this.activeStatusIntervals.delete(elementId);
    }, duration);
  }

  private pulseElement(elementId: string | undefined, scale: number): void {
    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      gsap.to(element, { scale, duration: 0.2, yoyo: true, repeat: 1 });
    }
  }

  private glowElement(elementId: string | undefined): void {
    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      gsap.to(element, { boxShadow: '0 0 25px cyan', duration: 0.3, repeat: 2, yoyo: true, clearProps: 'boxShadow' });
    }
  }

  private shakeElement(elementId: string | undefined): void {
    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      gsap.to(element, { x: '+=8', duration: 0.05, repeat: 6, yoyo: true, onComplete: () => gsap.set(element, { x: 0 }) });
    }
  }

  private slideElement(elementId: string | undefined, distance: number): void {
    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      gsap.to(element, { x: distance, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1 });
    }
  }

  private evolveAnimation(elementId: string | undefined): void {
    const element = elementId ? document.getElementById(elementId) : null;
    if (element) {
      gsap.fromTo(element, { scale: 1, rotate: 0 }, { scale: 1.6, rotate: 360, duration: 0.7, ease: 'back.out', onComplete: () => gsap.set(element, { scale: 1, rotate: 0 }) });
    }
  }

  private zoomCamera(x: number, y: number): void {
    const container = document.querySelector('.arena-shell') as HTMLElement | null;
    if (!container) {
      return;
    }

    gsap.to(container, {
      scale: 1.025,
      duration: 0.15,
      transformOrigin: `${x}px ${y}px`,
      onComplete: () => gsap.to(container, { scale: 1, duration: 0.15 })
    });
  }

  private flashScreen(intensity: number): void {
    const flash = document.createElement('div');
    flash.className = 'fx-flash';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: intensity, duration: 0.07, yoyo: true, repeat: 1, onComplete: () => flash.remove() });
  }

  private async showLottie(path: string, x: number, y: number): Promise<void> {
    if (this.prefersReducedMotion) {
      return;
    }

    const container = document.createElement('div');
    container.className = 'fx-lottie';
    container.style.left = `${x - 75}px`;
    container.style.top = `${y - 75}px`;
    this.host.nativeElement.appendChild(container);
    const { default: lottie } = await import('lottie-web');
    const animation = lottie.loadAnimation({ container, renderer: 'svg', loop: false, autoplay: true, path });
    window.setTimeout(() => {
      animation.destroy();
      container.remove();
    }, 1000);
  }

  private spawnParticles(x: number, y: number, color: string, count: number, attackType?: string): void {
    if (this.prefersReducedMotion) {
      return;
    }

    const finalColor = this.getAttackColor(attackType) ?? color;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        color: finalColor,
        size: 2 + Math.random() * 6,
        shape: attackType?.toLowerCase() === 'fire' ? 'triangle' : 'circle'
      });
    }
  }

  private getAttackColor(attackType?: string): string | null {
    const map: Record<string, string> = {
      fire: '#ff4d4d',
      water: '#4d79ff',
      lightning: '#ffdd4d',
      psychic: '#ff4dff',
      grass: '#4dff4d',
      fighting: '#ffa64d'
    };
    return attackType ? map[attackType.toLowerCase()] ?? null : null;
  }

  private spawnNumber(event: FxEvent, color: string): void {
    const element = document.createElement('div');
    element.className = `float-number ${event.type}`;
    element.textContent = event.type === 'draw' ? '+1' : `${event.type === 'heal' ? '+' : '-'}${event.value ?? 0}`;
    element.style.left = `${event.x}px`;
    element.style.top = `${event.y}px`;
    element.style.color = color;
    element.style.setProperty('--fx-color', color);
    this.host.nativeElement.appendChild(element);
    const damage = event.value ?? 0;
    const scale = event.type === 'damage' && damage >= 80 ? 1.65 : 1.35;
    gsap.fromTo(
      element,
      { y: 0, opacity: 1, scale: 0.5, rotation: -4 },
      { y: -80, opacity: 0, scale, rotation: 4, duration: 1.2, ease: 'power2.out', onComplete: () => element.remove() }
    );
  }

  private showKoText(x: number, y: number): void {
    const element = document.createElement('div');
    element.className = 'ko-text';
    element.textContent = 'KO!';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    this.host.nativeElement.appendChild(element);
    gsap.fromTo(
      element,
      { opacity: 0, scale: 0.4, y: 20, rotation: -10 },
      { opacity: 1, scale: 1.4, y: -20, rotation: 0, duration: 0.36, ease: 'back.out(1.7)',
        onComplete: () => gsap.to(element, { opacity: 0, scale: 1.1, y: -70, duration: 0.85, ease: 'power2.out', onComplete: () => element.remove() })
      }
    );
  }

  private tick(): void {
    if (this.documentHidden) {
      this.animationFrame = requestAnimationFrame(() => this.tick());
      return;
    }

    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.particles = this.particles.filter((particle) => particle.life < particle.maxLife);

    for (const particle of this.particles) {
      particle.life += 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98;
      particle.vy += 0.1;
      const alpha = 1 - particle.life / particle.maxLife;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;

      if (particle.shape === 'triangle') {
        const angle = Math.atan2(particle.vy, particle.vx);
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x + Math.cos(angle) * particle.size, particle.y + Math.sin(angle) * particle.size);
        this.ctx.lineTo(particle.x + Math.cos(angle + 2.2) * particle.size, particle.y + Math.sin(angle + 2.2) * particle.size);
        this.ctx.lineTo(particle.x + Math.cos(angle - 2.2) * particle.size, particle.y + Math.sin(angle - 2.2) * particle.size);
        this.ctx.fill();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.globalAlpha = 1;
    this.animationFrame = requestAnimationFrame(() => this.tick());
  }
}
