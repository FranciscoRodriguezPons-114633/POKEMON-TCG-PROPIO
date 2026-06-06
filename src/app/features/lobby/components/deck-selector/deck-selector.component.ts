import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Deck } from '../../../../core/models/deck.model';

@Component({
  selector: 'app-deck-selector',
  imports: [CommonModule],
  templateUrl: './deck-selector.component.html',
  styleUrl: './deck-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckSelectorComponent {
  @Input() decks: Deck[] | null = [];
  @Input() selectedDeckId: number | null = null;
  @Output() selectDeck = new EventEmitter<Deck>();
  @ViewChild('track') private readonly track?: ElementRef<HTMLDivElement>;

  scroll(direction: -1 | 1): void {
    this.track?.nativeElement.scrollBy({ left: direction * 320, behavior: 'smooth' });
  }
}

