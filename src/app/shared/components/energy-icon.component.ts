import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-energy-icon',
  imports: [CommonModule],
  template: `
    <span class="energy-icon" [ngClass]="typeClass" [style.--energy-color]="color">
      <span class="energy-core">{{ label }}</span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-grid;
      place-items: center;
    }

    .energy-icon {
      --energy-color: #38bdf8;
      background:
        radial-gradient(circle at 35% 25%, rgb(255 255 255 / 0.9), transparent 24%),
        radial-gradient(circle, color-mix(in srgb, var(--energy-color), white 18%), var(--energy-color));
      border: 1px solid rgb(255 255 255 / 0.58);
      border-radius: 50%;
      box-shadow: 0 0 16px color-mix(in srgb, var(--energy-color), transparent 18%), inset 0 -5px 10px rgb(0 0 0 / 0.18);
      color: #06111f;
      display: grid;
      font-size: 0.72rem;
      font-weight: 950;
      height: 1.75rem;
      place-items: center;
      text-transform: uppercase;
      transition: transform 160ms ease, box-shadow 160ms ease;
      width: 1.75rem;
    }

    .energy-icon:hover {
      box-shadow: 0 0 24px var(--energy-color), inset 0 -5px 10px rgb(0 0 0 / 0.18);
      transform: scale(1.12);
    }

    .energy-core {
      filter: drop-shadow(0 1px 2px rgb(255 255 255 / 0.45));
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyIconComponent {
  @Input() type = 'Colorless';

  get label(): string {
    return this.type.slice(0, 1).toUpperCase();
  }

  get typeClass(): string {
    return `energy-${this.type.toLowerCase()}`;
  }

  get color(): string {
    const map: Record<string, string> = {
      Fire: '#ff6b35',
      Water: '#38bdf8',
      Grass: '#4ade80',
      Lightning: '#fbbf24',
      Electric: '#fbbf24',
      Psychic: '#e879f9',
      Fighting: '#f97316',
      Darkness: '#6366f1',
      Metal: '#94a3b8',
      Dragon: '#7c3aed',
      Colorless: '#cbd5e1',
      Normal: '#cbd5e1'
    };
    return map[this.type] ?? '#cbd5e1';
  }
}
