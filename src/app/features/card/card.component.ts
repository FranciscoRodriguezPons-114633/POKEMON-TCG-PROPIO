import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { PokemonCard } from '../../core/models/pokemon-card.model';
import { HolographicShaderDirective } from '../../shared/directives/holographic-shader.directive';
import { PocketTiltDirective } from '../../shared/directives/pocket-tilt.directive';

@Component({
  selector: 'app-card',
  imports: [CommonModule, HolographicShaderDirective, PocketTiltDirective],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent implements OnInit {
  @Input({ required: true }) card!: PokemonCard;
  @Input() active = false;
  @Input() compact = false;
  @Input() mode: 'hand' | 'slot' | 'preview' = 'hand';
  @Input() selected = false;
  @Input() damaged = false;
  @Input() ko = false;
  @Input() status: 'sleeping' | 'paralyzed' | 'poisoned' | 'burned' | null = null;

  imageLoaded = false;

  @HostBinding('style.--card-accent')
  get accent(): string {
    return this.card?.accent ?? '#8be9fd';
  }

  get lowHp(): boolean {
    if (!this.card?.hp) {
      return false;
    }

    return ((this.card.currentHp ?? this.card.hp) / this.card.hp) < 0.3;
  }

  ngOnInit(): void {
    if (typeof CSS === 'undefined') {
      return;
    }

    const cssApi = CSS as typeof CSS & { paintWorklet?: { addModule(path: string): Promise<void> } };
    cssApi.paintWorklet?.addModule('/foil-worklet.js').catch(() => undefined);
  }
}
