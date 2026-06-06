import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, OnDestroy, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, finalize, Subject, takeUntil } from 'rxjs';
import { RECOMMENDED_DECK } from '../../../../core/constants/recommended-deck.const';
import { DeckCard } from '../../../../core/models/deck.model';
import { PokemonCard } from '../../../../core/models/pokemon-card.model';
import { CardApiService } from '../../../../core/services/card-api.service';
import { CardComponent } from '../../../card/card.component';

export interface DeckDraft {
  name: string;
  cards: DeckCard[];
}

@Component({
  selector: 'app-deck-builder',
  imports: [CommonModule, FormsModule, CardComponent],
  templateUrl: './deck-builder.component.html',
  styleUrl: './deck-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeckBuilderComponent implements OnInit, OnDestroy {
  @Output() saveDeck = new EventEmitter<DeckDraft>();

  readonly deckName = signal('Nuevo mazo');
  readonly catalog = signal<PokemonCard[]>([]);
  readonly isLoading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedType = signal('');
  readonly selectedRarity = signal<PokemonCard['rarity'] | ''>('');
  readonly deckCards = signal<PokemonCard[]>([]);
  readonly types = ['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless'];
  readonly skeletons = Array.from({ length: 8 });
  readonly maxDeckSize = 20;
  readonly maxCopies = 2;
  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly filteredCards = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const selectedType = this.selectedType();
    const selectedRarity = this.selectedRarity();

    return this.catalog().filter((card) => {
      const matchesSearch = !search || card.name.toLowerCase().includes(search);
      const matchesType = !selectedType || card.types.includes(selectedType);
      const matchesRarity = !selectedRarity || card.rarity === selectedRarity;
      return matchesSearch && matchesType && matchesRarity;
    });
  });

  readonly uniqueDeckCards = computed(() => {
    return this.deckCards().filter((card, index, cards) => cards.findIndex((item) => item.id === card.id) === index);
  });

  constructor(
    private readonly cardsApi: CardApiService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((value) => this.searchTerm.set(value));

    this.loadCatalog();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchInput$.next(value);
  }

  addToDeck(card: PokemonCard): void {
    if (this.deckCards().length >= this.maxDeckSize || this.getCount(card) >= this.maxCopies) {
      return;
    }

    this.deckCards.update((cards) => [...cards, card]);
  }

  removeFromDeck(card: PokemonCard): void {
    const index = this.deckCards().findIndex((item) => item.id === card.id);
    if (index < 0) {
      return;
    }

    this.deckCards.update((cards) => cards.filter((_, itemIndex) => itemIndex !== index));
  }

  getCount(card: PokemonCard): number {
    return this.deckCards().filter((item) => item.id === card.id).length;
  }

  loadRecommendedDeck(): void {
    const catalog = this.catalog();
    const recommendedCards = RECOMMENDED_DECK.flatMap((cardId) => {
      const card = catalog.find((item) => item.id === cardId);
      return card ? [card] : [];
    });

    if (!recommendedCards.length) {
      this.toastr.warning('El catalogo todavia no contiene las cartas recomendadas', 'Mazo recomendado', { timeOut: 2000 });
      return;
    }

    const nextDeck: PokemonCard[] = [];
    for (const card of recommendedCards) {
      const copies = nextDeck.filter((item) => item.id === card.id).length;
      if (nextDeck.length < this.maxDeckSize && copies < this.maxCopies) {
        nextDeck.push(card);
      }
    }

    this.deckCards.set(nextDeck);
    this.toastr.success('Mazo recomendado cargado ✓', undefined, { timeOut: 2000 });
  }

  emitSave(): void {
    const cards = this.uniqueDeckCards().map((card) => ({ cardId: card.id, quantity: this.getCount(card) }));
    this.saveDeck.emit({ name: this.deckName(), cards });
  }

  private loadCatalog(): void {
    this.isLoading.set(true);
    this.cardsApi.getCards('xy1').pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntil(this.destroy$)
    ).subscribe((cards) => this.catalog.set(cards));
  }
}
