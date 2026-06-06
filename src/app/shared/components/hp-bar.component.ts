import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-hp-bar',
  imports: [CommonModule],
  template: `
    <div class="hp-holo" [ngClass]="hpState" [attr.aria-label]="'HP ' + current + ' de ' + max">
      <div class="hp-track">
        <div class="hp-fill" [style.width.%]="percentage">
          <div class="hp-shine"></div>
        </div>
        <div class="hp-segments">
          <span *ngFor="let segment of segments" class="seg"></span>
        </div>
      </div>
      <span class="hp-label">{{ current }}<em>/{{ max }}</em></span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 8rem;
    }

    .hp-holo {
      align-items: center;
      backdrop-filter: blur(14px);
      background: rgb(0 0 0 / 0.7);
      border: 1px solid rgb(255 255 255 / 0.15);
      border-radius: 999px;
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.5), 0 0 20px rgba(var(--hp-glow-rgb, 74,222,128), 0.3);
      display: flex;
      gap: 0.38rem;
      padding: 0.25rem 0.62rem 0.25rem 0.38rem;
      position: relative;
      white-space: nowrap;
    }

    .hp-holo::after {
      border: 5px solid transparent;
      border-top-color: rgb(0 0 0 / 0.7);
      content: '';
      left: 50%;
      position: absolute;
      top: 100%;
      transform: translateX(-50%);
    }

    .hp-track {
      background: rgb(255 255 255 / 0.1);
      border-radius: 999px;
      height: 0.38rem;
      overflow: hidden;
      position: relative;
      width: 4.4rem;
    }

    .hp-fill {
      background: linear-gradient(90deg, #16a34a, #4ade80);
      border-radius: inherit;
      height: 100%;
      overflow: hidden;
      position: relative;
      transition: width 260ms ease;
    }

    .medium .hp-fill {
      background: linear-gradient(90deg, #ca8a04, #fbbf24);
    }

    .low .hp-fill {
      animation: hpDanger 0.8s ease-in-out infinite;
      background: linear-gradient(90deg, #b91c1c, #ef4444);
    }

    .hp-shine {
      animation: hpShimmer 2s ease-in-out infinite;
      background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.45), transparent);
      height: 100%;
      position: absolute;
      right: 0;
      top: 0;
      width: 30%;
    }

    .hp-segments {
      align-items: center;
      display: flex;
      inset: 0;
      justify-content: space-evenly;
      position: absolute;
    }

    .seg {
      background: rgb(0 0 0 / 0.3);
      height: 60%;
      width: 1px;
    }

    .hp-label {
      color: rgb(255 255 255 / 0.92);
      font-family: var(--font-display, 'Chakra Petch', monospace);
      font-size: 0.63rem;
      font-variant-numeric: tabular-nums;
      font-weight: 800;
      line-height: 1;
    }

    .hp-label em {
      color: rgb(255 255 255 / 0.42);
      font-style: normal;
      font-weight: 500;
    }

    @keyframes hpDanger {
      0%, 100% { box-shadow: 0 0 6px rgb(239 68 68 / 0.6); }
      50% { box-shadow: 0 0 14px rgb(239 68 68 / 0.9); }
    }

    @keyframes hpShimmer {
      0% { transform: translateX(-200%); }
      100% { transform: translateX(300%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .low .hp-fill,
      .hp-shine {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HpBarComponent {
  @Input() current = 0;
  @Input() max = 0;

  get percentage(): number {
    if (this.max <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.current / this.max) * 100));
  }

  get hpState(): 'high' | 'medium' | 'low' {
    if (this.percentage > 60) {
      return 'high';
    }

    if (this.percentage > 30) {
      return 'medium';
    }

    return 'low';
  }

  get segments(): number[] {
    return [0, 1, 2, 3, 4];
  }
}
