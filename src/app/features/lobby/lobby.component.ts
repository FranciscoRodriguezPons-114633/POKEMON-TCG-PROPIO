import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RECOMMENDED_DECK } from '../../core/constants/recommended-deck.const';
import { Deck } from '../../core/models/deck.model';
import { PokemonCard } from '../../core/models/pokemon-card.model';
import { CardCatalogService } from '../../core/services/card-catalog.service';
import { DeckService } from '../../core/services/deck.service';
import { LocalGameService } from '../../core/services/local-game.service';
import { RealGameService } from '../../core/services/real-game.service';
import { DeckBuilderComponent, DeckDraft } from './components/deck-builder/deck-builder.component';
import { DeckSelectorComponent } from './components/deck-selector/deck-selector.component';
import { MatchHistoryComponent } from './components/match-history/match-history.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-lobby',
  imports: [CommonModule, DeckBuilderComponent, DeckSelectorComponent, MatchHistoryComponent, SidebarComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LobbyComponent implements OnInit {
  activeTab: 'decks' | 'builder' = 'decks';
  showHistory = false;
  readonly decks = signal<Deck[]>([]);
  readonly catalog = signal<PokemonCard[]>([]);
  readonly selectedDeck = signal<Deck | null>(null);
  readonly status = signal('');

  constructor(
    private readonly decksApi: DeckService,
    private readonly catalogApi: CardCatalogService,
    private readonly localGame: LocalGameService,
    private readonly realGame: RealGameService,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadDecks();
    this.catalogApi.searchSet('xy1', 200).subscribe({
      next: (cards) => this.catalog.set(cards),
      error: () => this.status.set('No se pudo cargar el catalogo de cartas.')
    });
  }

  selectDeck(deck: Deck): void {
    this.selectedDeck.set(deck);
    this.status.set(`Mazo seleccionado: ${deck.name}`);
  }

  createGame(): void {
    const deck = this.selectedDeck();
    if (!deck) {
      this.status.set('Selecciona un mazo antes de crear partida.');
      this.activeTab = 'builder';
      this.toastr.warning('Primero crea o guarda un mazo', 'Lobby');
      return;
    }

    if (this.decksApi.isLocalDeck(deck)) {
      this.status.set('Este mazo esta guardado localmente. Iniciando modo prueba.');
      this.toastr.info('Mazo local: iniciando modo prueba', 'Lobby');
      this.playSolo();
      return;
    }

    void this.realGame.createGame(deck.id).then(() => {
      this.status.set(`Partida creada #${this.realGame.currentGame()?.id}`);
      this.toastr.success('Partida creada', 'Lobby');
      void this.router.navigate(['/arena']);
    }).catch(() => {
      this.status.set('No se pudo crear la partida.');
      this.toastr.error('No se pudo crear la partida', 'Backend');
    });
  }

  joinGame(): void {
    const deck = this.selectedDeck();
    const gameId = Number(window.prompt('Game ID para unirse'));
    if (!deck || !gameId) {
      this.status.set('Selecciona un mazo e ingresa un Game ID valido.');
      this.toastr.warning('Falta mazo o Game ID', 'Lobby');
      return;
    }

    void this.realGame.joinGame(gameId, deck.id).then(() => {
      this.toastr.success('Te uniste a la partida', 'Lobby');
      void this.router.navigate(['/arena']);
    }).catch(() => {
      this.status.set('No se pudo unir a la partida.');
      this.toastr.error('No se pudo unir a la partida', 'Backend');
    });
  }

  playSolo(): void {
    const playerDeck = this.buildLocalDeck();
    if (!playerDeck.length) {
      this.toastr.warning('Carga o guarda un mazo antes de iniciar el modo prueba', 'Lobby');
      return;
    }

    // El modo local usa dos mazos clonados para evitar compartir estado de HP entre jugadores.
    this.localGame.startLocalGame(this.cloneDeck(playerDeck), this.cloneDeck(playerDeck));
    this.toastr.success('Modo prueba iniciado', 'Lobby');
    void this.router.navigate(['/arena'], { queryParams: { mode: 'local' } });
  }

  saveDeck(deck: DeckDraft): void {
    this.decksApi.createDeck(deck).subscribe({
      next: (saved) => {
        this.decks.update((decks) => [...decks, saved]);
        this.selectedDeck.set(saved);
        this.activeTab = 'decks';
        const localMessage = this.decksApi.isLocalDeck(saved) ? ' (local)' : '';
        this.status.set(`Mazo guardado${localMessage}: ${saved.name}`);
        this.toastr.success(saved.name, this.decksApi.isLocalDeck(saved) ? 'Mazo guardado localmente' : 'Mazo guardado');
      },
      error: () => {
        this.status.set('No se pudo guardar el mazo.');
        this.toastr.error('No se pudo guardar el mazo', 'Backend');
      }
    });
  }

  private loadDecks(): void {
    this.decksApi.getDecks().subscribe({
      next: (decks) => {
        this.decks.set(decks);
        this.selectedDeck.set(decks[0] ?? null);
      },
      error: () => this.status.set('No se pudieron cargar tus mazos.')
    });
  }

  private buildLocalDeck(): PokemonCard[] {
    const catalog = this.catalog();
    const selected = this.selectedDeck();
    const savedDeckCards = selected ? this.expandDeckCards(selected, catalog) : [];
    if (savedDeckCards.length) {
      return savedDeckCards.slice(0, 20);
    }

    const recommended = RECOMMENDED_DECK.flatMap((cardId) => {
      const card = catalog.find((item) => item.id === cardId);
      return card ? [card] : [];
    });

    return recommended.length ? recommended.slice(0, 20) : catalog.slice(0, 20);
  }

  private expandDeckCards(deck: Deck, catalog: PokemonCard[]): PokemonCard[] {
    return deck.cards.flatMap((deckCard) => {
      const card = catalog.find((item) => item.id === deckCard.cardId);
      return card ? Array.from({ length: deckCard.quantity }, () => card) : [];
    });
  }

  private cloneDeck(deck: PokemonCard[]): PokemonCard[] {
    return deck.map((card) => ({
      ...card,
      currentHp: card.hp,
      types: [...card.types],
      attacks: card.attacks?.map((attack) => ({ ...attack, cost: [...attack.cost] })) ?? [],
      weaknesses: [...(card.weaknesses ?? [])],
      resistances: [...(card.resistances ?? [])],
      subtypes: [...(card.subtypes ?? [])],
      rules: [...(card.rules ?? [])]
    }));
  }
}
