import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-energy-generator',
  template: `
    <button type="button" class="energy-generator" (click)="attachEnergy.emit()" [disabled]="disabled">
      <span class="aura"></span>
      <span class="core">⚡</span>
      <span class="count">{{ energyPerTurn }}</span>
    </button>
  `,
  styleUrl: './energy-generator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnergyGeneratorComponent {
  @Input() energyPerTurn = 1;
  @Input() disabled = false;
  @Output() attachEnergy = new EventEmitter<void>();
}

