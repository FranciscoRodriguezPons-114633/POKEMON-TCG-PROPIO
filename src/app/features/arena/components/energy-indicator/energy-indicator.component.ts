import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EnergyAttachment } from '../../../../core/models/game.model';

@Component({
  selector: 'app-energy-indicator',
  imports: [CommonModule],
  template: `
    <div class="energy-badge" title="Energia adjunta">
      <span>{{ count }}</span>
    </div>
  `,
  styleUrl: './energy-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyIndicatorComponent {
  @Input() energy: EnergyAttachment[] | number | null = 0;

  get count(): number {
    return Array.isArray(this.energy) ? this.energy.length : this.energy ?? 0;
  }
}

