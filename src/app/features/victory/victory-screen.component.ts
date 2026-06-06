import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import gsap from 'gsap';
import { Howl } from 'howler';
import { VictoryData, PokemonType } from './models/victory-data.model';
import { VictoryParticlesService } from './victory-particles.service';

@Component({
  selector: 'app-victory-screen',
  imports: [CommonModule],
  templateUrl: './victory-screen.component.html',
  styleUrl: './victory-screen.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VictoryScreenComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) data!: VictoryData;
  @Output() rematch = new EventEmitter<void>();
  @Output() mainMenu = new EventEmitter<void>();

  @ViewChild('particleCanvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('winCardEl', { static: true }) private readonly winCardRef!: ElementRef<HTMLElement>;
  @ViewChild('victoryRoot', { static: true }) private readonly rootRef!: ElementRef<HTMLElement>;

  private readonly particles = inject(VictoryParticlesService);
  private gsapCtx?: gsap.Context;
  private howl?: Howl;
  private unlistenMove?: () => void;
  private unlistenLeave?: () => void;

  ngAfterViewInit(): void {
    this.particles.init(this.canvasRef.nativeElement);
    this.gsapCtx = gsap.context(() => this.playSequence(), this.rootRef.nativeElement);
    this.initTiltEffect();
    this.playAudio();
  }

  ngOnDestroy(): void {
    this.gsapCtx?.revert();
    this.particles.destroy();
    this.howl?.unload();
    this.unlistenMove?.();
    this.unlistenLeave?.();
  }

  getTypeEmoji(type: PokemonType): string {
    const map: Record<string, string> = {
      fire: 'F',
      water: 'W',
      grass: 'G',
      electric: 'E',
      lightning: 'E',
      psychic: 'P',
      fighting: 'K',
      dark: 'D',
      darkness: 'D',
      metal: 'M',
      dragon: 'DR',
      ice: 'I',
      colorless: 'C',
      normal: 'C'
    };
    return map[type] ?? 'C';
  }

  private playSequence(): void {
    const tl = gsap.timeline();
    tl.fromTo('.victory-overlay', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      .call(() => this.particles.burst(), [], 0.08)
      .fromTo('.victory-title-wrap', { scale: 0.4, y: -30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.7)' }, 0.2)
      .fromTo('.type-emblem', { scale: 0, opacity: 0 }, { scale: 1, opacity: 0.07, duration: 0.8, ease: 'power2.out' }, 0.15)
      .fromTo('.winning-card-wrap', { scale: 0.2, rotate: -20, y: 60, opacity: 0 }, { scale: 1, rotate: 0, y: 0, opacity: 1, duration: 0.65, ease: 'back.out(1.4)' }, 0.35)
      .fromTo('.reward-pack-wrap', { scale: 0, rotate: 25, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 0.55)
      .fromTo('.stat-pill', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: 'power2.out' }, 0.75)
      .call(() => this.animateXpBar(), [], 1.0);

    if (this.data.rewards.levelAfter > this.data.rewards.levelBefore) {
      tl.call(() => this.showLevelUpBanner(), [], 2.3);
    }

    tl.fromTo('.action-row button', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.1, ease: 'back.out(1.4)' }, 1.1);
  }

  private animateXpBar(): void {
    const fill = this.rootRef.nativeElement.querySelector('.xp-fill-new') as HTMLElement | null;
    const xpEl = this.rootRef.nativeElement.querySelector('.xp-gain-number') as HTMLElement | null;
    if (!fill || !xpEl) {
      return;
    }

    const targetWidth = Math.max(0, this.data.rewards.xpAfter - this.data.rewards.xpBefore);
    gsap.set(xpEl, { opacity: 1 });
    gsap.fromTo(fill, { width: '0%' }, {
      width: `${targetWidth}%`,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.fromTo('.xp-shimmer', { x: '-100%', opacity: 1 }, { x: '300%', opacity: 1, duration: 0.6, ease: 'power1.inOut' });
      }
    });

    const counter = { val: 0 };
    gsap.to(counter, {
      val: this.data.rewards.xpGained,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        xpEl.textContent = `+${Math.round(counter.val)} XP`;
      }
    });
  }

  private showLevelUpBanner(): void {
    const banner = this.rootRef.nativeElement.querySelector('.levelup-banner') as HTMLElement | null;
    if (!banner) {
      return;
    }

    gsap.timeline()
      .fromTo(banner, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.7)' })
      .to(banner, { duration: 1.8 })
      .to(banner, { scaleY: 0, opacity: 0, duration: 0.2, ease: 'power2.in' });
    this.particles.levelUpBurst();
    this.howl?.play('levelup');
  }

  private initTiltEffect(): void {
    const card = this.winCardRef.nativeElement;
    const move = (event: MouseEvent): void => {
      const rect = card.getBoundingClientRect();
      const dx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const dy = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const winningCard = card.querySelector('.winning-card');
      if (!winningCard) {
        return;
      }

      gsap.to(winningCard, { rotateY: dx * 22, rotateX: -dy * 15, scale: 1.05, duration: 0.15, ease: 'power1.out', transformPerspective: 600 });
      const foil = card.querySelector('.card-foil-overlay') as HTMLElement | null;
      foil?.style.setProperty('--mx', `${((dx + 1) / 2) * 100}`);
      foil?.style.setProperty('--my', `${((dy + 1) / 2) * 100}`);
    };
    const leave = (): void => {
      const winningCard = card.querySelector('.winning-card');
      if (!winningCard) {
        return;
      }
      gsap.to(winningCard, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)', transformPerspective: 600 });
    };

    card.addEventListener('mousemove', move);
    card.addEventListener('mouseleave', leave);
    this.unlistenMove = () => card.removeEventListener('mousemove', move);
    this.unlistenLeave = () => card.removeEventListener('mouseleave', leave);
  }

  private playAudio(): void {
    this.howl = new Howl({
      src: ['/assets/audio/victory.webm', '/assets/audio/victory.mp3'],
      volume: 0.72,
      sprite: {
        fanfare: [0, 3500],
        levelup: [4000, 2000]
      },
      onloaderror: () => undefined,
      onplayerror: () => undefined
    });
    this.howl.play('fanfare');
  }
}
