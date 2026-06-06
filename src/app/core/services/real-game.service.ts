import { computed, Injectable, OnDestroy, signal } from '@angular/core';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import { Game, GamePlayer, PokemonInstance, RealtimeGameEvent } from '../models/game.model';
import { PokemonCard } from '../models/pokemon-card.model';
import { AuthService } from './auth.service';
import { FxService } from './fx.service';
import { GameApiService } from './game-api.service';
import { WebSocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class RealGameService implements OnDestroy {
  readonly currentGame = signal<Game | null>(null);
  readonly currentPlayerHand = signal<PokemonCard[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly backendMode = signal(false);

  private polling?: Subscription;

  readonly myPlayer = computed(() => this.findPlayer(true));
  readonly opponentPlayer = computed(() => this.findPlayer(false));
  readonly isMyTurn = computed(() => {
    const game = this.currentGame();
    const myId = this.auth.getPlayerId();
    if (!game || !myId) {
      return false;
    }

    const myIndex = game.players.findIndex((player) => player.playerId === myId);
    return game.currentTurn === (myIndex === 0 ? 'PLAYER' : 'OPPONENT');
  });
  readonly myActivePokemon = computed(() => this.myPlayer()?.activePokemon ?? null);
  readonly opponentActivePokemon = computed(() => this.opponentPlayer()?.activePokemon ?? null);
  readonly myBench = computed(() => this.myPlayer()?.bench ?? []);
  readonly opponentBench = computed(() => this.opponentPlayer()?.bench ?? []);

  constructor(
    private readonly gameApi: GameApiService,
    private readonly ws: WebSocketService,
    private readonly auth: AuthService,
    private readonly fx: FxService
  ) {}

  async createGame(deckId: number): Promise<void> {
    await this.run(async () => {
      const game = await firstValueFrom(this.gameApi.createGame(deckId));
      this.activateGame(game);
    });
  }

  async joinGame(gameId: number, deckId: number): Promise<void> {
    await this.run(async () => {
      const game = await firstValueFrom(this.gameApi.joinGame(gameId, deckId));
      this.activateGame(game);
    });
  }

  async loadGame(gameId: number): Promise<void> {
    await this.run(async () => {
      const game = await firstValueFrom(this.gameApi.getGame(gameId));
      this.activateGame(game);
    });
  }

  async refreshGame(): Promise<void> {
    const game = this.currentGame();
    if (!game) {
      return;
    }

    const updated = await firstValueFrom(this.gameApi.getGame(game.id));
    this.currentGame.set(updated);
  }

  async refreshHand(): Promise<void> {
    const game = this.currentGame();
    const playerId = this.auth.getPlayerId();
    if (!game || !playerId) {
      return;
    }

    const hand = await firstValueFrom(this.gameApi.getHand(game.id, playerId));
    this.currentPlayerHand.set(hand);
  }

  async placeActive(cardId: string): Promise<void> {
    const game = this.currentGame();
    if (!game) {
      return;
    }

    await firstValueFrom(this.gameApi.placeActive(game.id, cardId));
    await this.syncNow();
  }

  async placeBench(cardId: string): Promise<void> {
    const game = this.currentGame();
    if (!game) {
      return;
    }

    await firstValueFrom(this.gameApi.placeBench(game.id, cardId));
    await this.syncNow();
  }

  async confirmSetup(): Promise<void> {
    const game = this.currentGame();
    if (!game) {
      return;
    }

    this.currentGame.set(await firstValueFrom(this.gameApi.confirmSetup(game.id)));
    await this.refreshHand();
  }

  async sendAction(actionType: string, payload?: Record<string, unknown>): Promise<void> {
    const game = this.currentGame();
    if (!game) {
      return;
    }

    await firstValueFrom(this.gameApi.sendAction(game.id, actionType, payload));
  }

  async playCard(card: PokemonCard): Promise<void> {
    if (card.supertype === 'Energy') {
      await this.sendAction('ATTACH_ENERGY', { cardId: card.id, targetPokemonId: 'active' });
      return;
    }

    if (card.supertype === 'Trainer') {
      await this.sendAction('PLAY_TRAINER', { cardId: card.id });
      return;
    }

    if (this.currentGame()?.status === 'SETUP' && !this.myActivePokemon()) {
      await this.placeActive(card.id);
      return;
    }

    await this.sendAction('BENCH_POKEMON', { cardId: card.id });
  }

  async attack(attackIndex: number): Promise<void> {
    await this.sendAction('ATTACK', { attackIndex });
  }

  async endTurn(): Promise<void> {
    await this.sendAction('END_TURN');
  }

  fxEnergyAttach(x: number, y: number, elementId?: string): void {
    this.fx.energyAttach(x, y, elementId);
  }

  async syncNow(): Promise<void> {
    await Promise.all([this.refreshGame(), this.refreshHand()]);
  }

  ngOnDestroy(): void {
    this.polling?.unsubscribe();
    this.ws.disconnect();
  }

  private activateGame(game: Game): void {
    this.backendMode.set(true);
    this.currentGame.set(game);
    this.ws.connect();
    this.ws.subscribeToGame(game.id, (event) => this.handleEvent(event));
    this.startPolling();
    void this.refreshHand();
  }

  private startPolling(): void {
    this.polling?.unsubscribe();
    this.polling = interval(5000).subscribe(() => void this.syncNow());
  }

  private handleEvent(event: RealtimeGameEvent): void {
    if (event.type.includes('DRAW')) {
      this.fx.draw(window.innerWidth * 0.5, window.innerHeight * 0.8);
    }
    if (event.type.includes('ENERGY')) {
      const active = this.myActivePokemon();
      const elementId = active ? `card-${active.cardId}` : undefined;
      this.fx.energyAttach(window.innerWidth * 0.5, window.innerHeight * 0.62, elementId);
    }
    if (event.type.includes('KO')) {
      this.fx.ko(window.innerWidth * 0.5, window.innerHeight * 0.42);
    }
    if (event.type.includes('DAMAGE') || event.type.includes('ATTACK')) {
      const value = Number((event.payload as any)?.damage ?? 0);
      const type = String((event.payload as any)?.attackType ?? '');
      this.fx.attackImpact(window.innerWidth * 0.5, window.innerHeight * 0.42, type || undefined);
      this.fx.damage(value, window.innerWidth * 0.5, window.innerHeight * 0.42);
    }

    void this.syncNow();
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo sincronizar con el backend');
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  private findPlayer(self: boolean): GamePlayer | null {
    const game = this.currentGame();
    const myId = this.auth.getPlayerId();
    if (!game || !myId) {
      return null;
    }

    const mine = game.players.find((player) => player.playerId === myId) ?? null;
    if (self) {
      return mine;
    }

    return game.players.find((player) => player.playerId !== myId) ?? null;
  }

  cardFromInstance(instance: PokemonInstance | null): PokemonCard | null {
    if (!instance) {
      return null;
    }

    return {
      id: instance.cardId,
      name: instance.name,
      hp: instance.hp,
      currentHp: instance.currentHp,
      types: instance.types,
      rarity: 'common',
      imageUrl: '',
      accent: '#8be9fd',
      retreatCost: instance.retreatCost
    };
  }
}
