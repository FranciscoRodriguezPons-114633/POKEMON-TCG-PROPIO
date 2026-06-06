import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PokemonCard } from '../../core/models/pokemon-card.model';
import { GameService } from '../../core/services/game.service';
import { HandLayoutService } from '../../core/services/hand-layout.service';
import { RealGameService } from '../../core/services/real-game.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-hand',
  imports: [CommonModule, DragDropModule, CardComponent],
  templateUrl: './hand.component.html',
  styleUrl: './hand.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HandComponent {
  readonly hoveredIndex = signal<number | null>(null);

  constructor(
    readonly game: GameService,
    readonly realGame: RealGameService,
    readonly layout: HandLayoutService
  ) {}

  play(card: PokemonCard, event: MouseEvent): void {
    if (this.realGame.backendMode()) {
      void this.realGame.playCard(card);
      return;
    }

    this.game.setActivePokemon(card, { x: event.clientX, y: event.clientY });
  }

  cardTransform(index: number): string {
    const transform = this.layout.getTransform(index, this.handLength());
    const hovered = this.hoveredIndex();
    if (hovered === null) {
      return `translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px) rotate(${transform.angle}deg)`;
    }

    const distance = index - hovered;
    const spread = distance === 0 ? 0 : Math.sign(distance) * Math.min(Math.abs(distance) * 12, 30);
    if (distance === 0) {
      return `translate3d(${transform.x + spread}px, ${transform.y - 40}px, 60px) rotate(0deg) scale(1.12)`;
    }

    return `translate3d(${transform.x + spread}px, ${transform.y}px, ${transform.z}px) rotate(${transform.angle}deg)`;
  }

  cardZIndex(index: number): number {
    if (this.hoveredIndex() === index) {
      return 999;
    }

    return this.layout.getTransform(index, this.handLength()).zIndex;
  }

  onCardHover(index: number): void {
    this.hoveredIndex.set(index);
  }

  onCardLeave(): void {
    this.hoveredIndex.set(null);
  }

  hand(): PokemonCard[] {
    return this.realGame.backendMode() ? this.realGame.currentPlayerHand() : this.game.playerHand();
  }

  deckCount(): number {
    return this.realGame.backendMode() ? this.realGame.myPlayer()?.handSize ?? this.realGame.currentPlayerHand().length : this.game.playerDeckCount();
  }

  canPlay(): boolean {
    return this.realGame.backendMode() ? this.realGame.isMyTurn() || this.realGame.currentGame()?.status === 'SETUP' : this.game.canAct();
  }

  draw(event: MouseEvent): void {
    if (this.realGame.backendMode()) {
      void this.realGame.sendAction('DRAW');
      return;
    }

    this.game.drawCard({ x: event.clientX, y: event.clientY });
  }

  private handLength(): number {
    return this.hand().length;
  }
}
