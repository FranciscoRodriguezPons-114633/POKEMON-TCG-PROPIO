import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-prize-cards',
  imports: [CommonModule],
  template: `
    <div class="prize-cards" [attr.aria-label]="remaining + ' premios restantes'">
      <span
        *ngFor="let item of slots; let index = index"
        class="prize-card"
        [class.taken]="index >= remaining"
      ></span>
    </div>
  `,
  styles: [`
    .prize-cards {
      display: flex;
      gap: 0.22rem;
    }

    .prize-card {
      background:
        linear-gradient(135deg, rgb(56 189 248 / 0.34), transparent 45%),
        linear-gradient(145deg, #1e3a5f, #0f172a);
      border: 1px solid rgb(125 211 252 / 0.34);
      border-radius: 0.24rem;
      box-shadow: 0 0 10px rgb(56 189 248 / 0.18);
      height: 1.45rem;
      transform-origin: center;
      transition: opacity 180ms ease, transform 180ms ease;
      width: 1rem;
    }

    .prize-card.taken {
      opacity: 0.22;
      transform: rotateY(180deg) scale(0.82);
    }

    @media (max-width: 640px) {
      .prize-card {
        height: 1.2rem;
        width: 0.82rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrizeCardsComponent {
  @Input() total = 6;
  @Input() remaining = 6;

  get slots(): number[] {
    return Array.from({ length: this.total }, (_, index) => index);
  }
}
