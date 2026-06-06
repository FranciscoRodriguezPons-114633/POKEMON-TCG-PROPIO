import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-health-bar',
  imports: [CommonModule],
  template: `
    <div class="health-bar-container" [attr.aria-label]="'HP ' + currentHp + ' de ' + maxHp">
      <div class="health-bar-fill" [style.width.%]="percentage" [style.backgroundColor]="barColor"></div>
      <span class="health-text">{{ currentHp }}/{{ maxHp }}</span>
    </div>
  `,
  styles: [`
    .health-bar-container {
      background: rgb(0 0 0 / 0.52);
      border: 1px solid rgb(255 255 255 / 0.18);
      border-radius: 999px;
      box-shadow: inset 0 1px 8px rgb(0 0 0 / 0.42);
      height: 1.25rem;
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .health-bar-fill {
      height: 100%;
      transition: width 260ms ease, background-color 260ms ease;
    }

    .health-text {
      align-items: center;
      color: white;
      display: flex;
      font-size: 0.72rem;
      font-weight: 900;
      inset: 0;
      justify-content: center;
      position: absolute;
      text-shadow: 0 1px 2px black;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthBarComponent {
  @Input() currentHp = 0;
  @Input() maxHp = 0;

  get percentage(): number {
    if (this.maxHp <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.currentHp / this.maxHp) * 100));
  }

  get barColor(): string {
    if (this.percentage > 60) {
      return '#2ecc71';
    }
    if (this.percentage > 30) {
      return '#f39c12';
    }
    return '#e74c3c';
  }
}

