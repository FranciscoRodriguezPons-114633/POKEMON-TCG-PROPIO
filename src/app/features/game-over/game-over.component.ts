import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-over',
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="visible">
      <div class="modal">
        <p class="eyebrow">Battle complete</p>
        <h2>{{ winner === 'player' ? 'Victoria' : 'Derrota' }}</h2>
        <button type="button" (click)="restart.emit()">Jugar de nuevo</button>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      align-items: center;
      background: rgb(0 0 0 / 0.78);
      display: flex;
      inset: 0;
      justify-content: center;
      padding: 1rem;
      position: fixed;
      z-index: 200;
    }

    .modal {
      background: linear-gradient(145deg, #1e293b, #0f172a);
      border: 1px solid rgb(255 255 255 / 0.18);
      border-radius: 16px;
      box-shadow: 0 24px 80px rgb(0 0 0 / 0.5);
      color: white;
      min-width: min(24rem, 92vw);
      padding: 2rem;
      text-align: center;
    }

    .eyebrow {
      color: #93c5fd;
      font-size: 0.78rem;
      font-weight: 900;
      letter-spacing: 0;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
    }

    h2 {
      font-size: clamp(2rem, 8vw, 4rem);
      line-height: 1;
      margin: 0;
    }

    button {
      background: #3b82f6;
      border: 0;
      border-radius: 999px;
      color: white;
      cursor: pointer;
      font-weight: 900;
      margin-top: 1.4rem;
      padding: 0.75rem 1.2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameOverComponent {
  @Input() visible = false;
  @Input() winner: 'player' | 'opponent' | null = null;
  @Output() restart = new EventEmitter<void>();
}

