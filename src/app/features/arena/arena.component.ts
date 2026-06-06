import { CommonModule } from '@angular/common';
import { AfterViewChecked, ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, OnDestroy, OnInit, Renderer2, signal, ViewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import gsap from 'gsap';
import { PokemonCard } from '../../core/models/pokemon-card.model';
import { GameService } from '../../core/services/game.service';
import { LocalGameService, LocalGameState } from '../../core/services/local-game.service';
import { PokemonTcgApiService } from '../../core/services/pokemon-tcg-api.service';
import { RealGameService } from '../../core/services/real-game.service';
import { EnergyIconComponent } from '../../shared/components/energy-icon.component';
import { HpBarComponent } from '../../shared/components/hp-bar.component';
import { PrizeCardsComponent } from '../../shared/components/prize-cards.component';
import { CardComponent } from '../card/card.component';
import { HandComponent } from '../hand/hand.component';
import { VictoryData, PokemonType } from '../victory/models/victory-data.model';
import { VictoryScreenComponent } from '../victory/victory-screen.component';
import { Background3dComponent } from './background-3d.component';
import { EnergyGeneratorComponent } from './components/energy-generator/energy-generator.component';
import { EnergyIndicatorComponent } from './components/energy-indicator/energy-indicator.component';

@Component({
  selector: 'app-arena',
  imports: [
    CommonModule,
    Background3dComponent,
    CardComponent,
    EnergyGeneratorComponent,
    EnergyIconComponent,
    EnergyIndicatorComponent,
    HandComponent,
    HpBarComponent,
    PrizeCardsComponent,
    VictoryScreenComponent
  ],
  templateUrl: './arena.component.html',
  styleUrl: './arena.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArenaComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('turnBanner') private readonly turnBanner?: ElementRef<HTMLElement>;
  @ViewChild('parallaxBg') private readonly parallaxBg?: ElementRef<HTMLElement>;
  @ViewChild('parallaxMid') private readonly parallaxMid?: ElementRef<HTMLElement>;
  @ViewChild('parallaxFg') private readonly parallaxFg?: ElementRef<HTMLElement>;
  @ViewChild(Background3dComponent) private readonly background3d?: Background3dComponent;

  private lastDeck = [] as Parameters<GameService['initGame']>[0];
  private lastTurnLabel = '';
  private turnBannerTween?: gsap.core.Timeline;

  readonly localGame = inject(LocalGameService);
  readonly localMode = signal(false);
  readonly localState = toSignal(this.localGame.state$, { initialValue: this.localGame.snapshot });
  readonly arenaType = computed(() => (
    this.localMode()
      ? this.localState().players.player1.activePokemon?.types?.[0]
      : (this.realGame.myActivePokemon()?.types?.[0] ?? this.game.playerActive()?.types?.[0])
  ) ?? 'Normal');

  readonly turnLabel = computed(() => {
    if (this.localMode()) {
      return this.localState().currentTurn === 'player1' ? 'Jugador 1' : 'Jugador 2';
    }

    if (this.realGame.backendMode()) {
      return this.realGame.isMyTurn() ? 'Tu turno' : 'Turno rival';
    }

    return this.game.turn() === 'player' ? 'Tu turno' : 'Turno rival';
  });

  readonly turnTone = computed(() => {
    const ownTurn = this.localMode()
      ? this.localState().currentTurn === 'player1'
      : this.realGame.backendMode()
        ? this.realGame.isMyTurn()
        : this.game.turn() === 'player';

    return ownTurn ? 'own' : 'opponent';
  });

  constructor(
    readonly game: GameService,
    readonly realGame: RealGameService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: PokemonTcgApiService,
    private readonly host: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  ngOnInit(): void {
    const isLocal = this.route.snapshot.queryParamMap.get('mode') === 'local';
    this.localMode.set(isLocal);
    this.updateTypeGlow();
    if (!isLocal) {
      this.loadGame();
    }
  }

  ngOnDestroy(): void {
    this.turnBannerTween?.kill();
  }

  ngAfterViewChecked(): void {
    const label = this.turnLabel();
    if (label !== this.lastTurnLabel) {
      this.lastTurnLabel = label;
      this.updateTypeGlow();
      this.animateTurnBanner();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (event.clientX - cx) / Math.max(cx, 1);
    const dy = (event.clientY - cy) / Math.max(cy, 1);

    this.setLayerTransform(this.parallaxBg, dx * -8, dy * -6);
    this.setLayerTransform(this.parallaxMid, dx * -3, dy * -2);
    this.setLayerTransform(this.parallaxFg, dx * 4, dy * 3);
    this.background3d?.updateLightPosition(dx, dy);
  }

  restart(): void {
    if (this.lastDeck.length) {
      this.game.restart(this.lastDeck);
      return;
    }

    this.loadGame();
  }

  onRematch(): void {
    if (this.localMode()) {
      const state = this.localState();
      const playerDeck = this.rebuildLocalDeck(state, 'player1');
      const opponentDeck = this.rebuildLocalDeck(state, 'player2');
      this.localGame.startLocalGame(playerDeck, opponentDeck);
      return;
    }

    this.restart();
  }

  onMainMenu(): void {
    void this.router.navigate(['/lobby']);
  }

  readonly victoryData = computed((): VictoryData | null => {
    if (this.localMode()) {
      const winner = this.localState().winner;
      if (!winner) {
        return null;
      }
      return this.buildLocalVictoryData(winner);
    }

    const demoWinner = this.game.gameOver();
    if (demoWinner) {
      return this.buildDemoVictoryData(demoWinner);
    }

    const backendGame = this.realGame.currentGame();
    if (backendGame?.status === 'FINISHED') {
      const localWon = backendGame.winnerId === this.realGame.myPlayer()?.playerId;
      return this.buildBackendVictoryData(localWon ? 'local' : 'opponent');
    }

    return null;
  });

  attachEnergy(): void {
    if (this.localMode()) {
      return;
    }

    const active = this.realGame.backendMode() ? this.realGame.myActivePokemon()?.cardId : this.game.playerActive()?.id;
    const center = active ? this.centerOf(`card-${active}`) : null;

    if (this.realGame.backendMode()) {
      if (center && active) {
        this.realGame.fxEnergyAttach(center.x, center.y, `card-${active}`);
      }
      void this.realGame.sendAction('ATTACH_ENERGY', { targetPokemonId: 'active' });
      return;
    }

    if (center && active) {
      this.realGame.fxEnergyAttach(center.x, center.y, `card-${active}`);
    }
  }

  localDraw(): void {
    this.localGame.drawCard(this.localGame.snapshot.currentTurn);
  }

  localPlay(cardId: string, state: LocalGameState): void {
    const playerId = state.currentTurn;
    const card = state.players[playerId].hand.find((item) => item.id === cardId);
    if (card) {
      this.localGame.playCard(playerId, card);
    }
  }

  localAttack(index: number): void {
    this.localGame.attackWith(index);
  }

  localPassTurn(): void {
    this.localGame.switchTurn();
  }

  activeHp(card: { currentHp?: number; hp: number } | null | undefined): number {
    return card?.currentHp ?? card?.hp ?? 0;
  }

  hpPercent(card: { currentHp?: number; hp: number } | null | undefined): number {
    if (!card?.hp) {
      return 0;
    }

    return Math.max(0, Math.min(100, (this.activeHp(card) / card.hp) * 100));
  }

  localDeckCount(player: 'player1' | 'player2'): number {
    return this.localState().players[player].deck.length;
  }

  demoOpponentHandCount(): number {
    return this.game.opponentState().hand.length;
  }

  handSlots(count: number | null | undefined): number[] {
    return Array.from({ length: Math.max(0, count ?? 0) }, (_, index) => index);
  }

  typeClass(type: string | undefined): string {
    return `type-${(type ?? 'colorless').toLowerCase()}`;
  }

  private setLayerTransform(layer: ElementRef<HTMLElement> | undefined, x: number, y: number): void {
    if (!layer) {
      return;
    }

    this.renderer.setStyle(layer.nativeElement, 'transform', `translate3d(${x}px, ${y}px, 0)`);
  }

  private updateTypeGlow(): void {
    const typeColors: Record<string, string> = {
      fire: '255, 107, 53',
      water: '56, 189, 248',
      grass: '74, 222, 128',
      lightning: '251, 191, 36',
      electric: '251, 191, 36',
      psychic: '232, 121, 249',
      fighting: '249, 115, 22',
      darkness: '99, 102, 241',
      dark: '99, 102, 241',
      metal: '148, 163, 184',
      dragon: '124, 58, 237',
      ice: '103, 232, 249',
      colorless: '203, 213, 225',
      normal: '203, 213, 225'
    };
    const key = this.arenaType().toLowerCase();
    this.renderer.setStyle(this.host.nativeElement, '--slot-glow-rgb', typeColors[key] ?? typeColors['colorless']);
  }

  private centerOf(elementId: string): { x: number; y: number } | null {
    const element = document.getElementById(elementId);
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  private loadGame(): void {
    this.api.getRandomCards(20).subscribe((cards) => {
      this.lastDeck = cards;
      this.game.initGame(cards);
    });
  }

  private buildLocalVictoryData(winner: 'player1' | 'player2'): VictoryData {
    const state = this.localState();
    const player = state.players[winner];
    const active = player.activePokemon ?? player.bench[0] ?? this.fallbackCard();
    const isLocal = winner === 'player1';
    return this.toVictoryData({
      winner: isLocal ? 'local' : 'opponent',
      winnerName: isLocal ? 'Jugador 1' : 'Jugador 2',
      card: active,
      kos: Math.max(0, 3 - state.players[isLocal ? 'player2' : 'player1'].prizes),
      rounds: Math.max(1, state.log.filter((item) => item.includes('Turno')).length + 1),
      prizesCollected: Math.max(0, 3 - player.prizes),
      damageDealt: Math.max(120, (3 - state.players[isLocal ? 'player2' : 'player1'].prizes) * 90)
    });
  }

  private buildDemoVictoryData(winner: 'player' | 'opponent'): VictoryData {
    const isLocal = winner === 'player';
    const card = (isLocal ? this.game.playerActive() : this.game.opponentActive()) ?? this.fallbackCard();
    return this.toVictoryData({
      winner: isLocal ? 'local' : 'opponent',
      winnerName: isLocal ? 'Entrenador' : 'Rival demo',
      card,
      kos: isLocal ? 6 - this.game.opponentPrizeCount() : 6 - this.game.playerPrizeCount(),
      rounds: 6,
      prizesCollected: isLocal ? 6 - this.game.playerPrizeCount() : 6 - this.game.opponentPrizeCount(),
      damageDealt: isLocal ? 420 : 280
    });
  }

  private buildBackendVictoryData(winner: 'local' | 'opponent'): VictoryData {
    const instance = winner === 'local' ? this.realGame.myActivePokemon() : this.realGame.opponentActivePokemon();
    const card = instance ? this.realGame.cardFromInstance(instance) : null;
    return this.toVictoryData({
      winner,
      winnerName: winner === 'local' ? 'Entrenador' : 'Rival conectado',
      card: card ?? this.fallbackCard(),
      kos: 3,
      rounds: this.realGame.currentGame()?.turnNumber ?? 1,
      prizesCollected: winner === 'local' ? 6 - (this.realGame.myPlayer()?.prizeCardsLeft ?? 6) : 6 - (this.realGame.opponentPlayer()?.prizeCardsLeft ?? 6),
      damageDealt: 360
    });
  }

  private toVictoryData(input: {
    winner: 'local' | 'opponent';
    winnerName: string;
    card: PokemonCard;
    kos: number;
    rounds: number;
    prizesCollected: number;
    damageDealt: number;
  }): VictoryData {
    const levelBefore = 7;
    const xpBefore = input.winner === 'local' ? 64 : 38;
    const xpGained = input.winner === 'local' ? 145 : 40;
    const xpAfterRaw = xpBefore + Math.round(xpGained / 3);
    const levelAfter = levelBefore + Math.floor(xpAfterRaw / 100);
    const xpAfter = xpAfterRaw % 100;

    return {
      winner: input.winner,
      winnerName: input.winnerName,
      winningCard: {
        id: input.card.id,
        name: input.card.name,
        imageUrl: input.card.imageUrl,
        type: this.toPokemonType(input.card.types?.[0]),
        currentHp: this.activeHp(input.card),
        maxHp: input.card.hp,
        isEX: input.card.rarity === 'ex'
      },
      stats: {
        kos: Math.max(0, input.kos),
        rounds: Math.max(1, input.rounds),
        prizesCollected: Math.max(0, input.prizesCollected),
        damageDealt: Math.max(0, input.damageDealt)
      },
      rewards: {
        xpGained,
        levelBefore,
        levelAfter,
        xpBefore,
        xpAfter,
        packReward: input.winner === 'local',
        packType: input.winner === 'local' ? 'gold' : 'standard'
      }
    };
  }

  private rebuildLocalDeck(state: LocalGameState, playerId: 'player1' | 'player2'): PokemonCard[] {
    const player = state.players[playerId];
    return [
      player.activePokemon,
      ...player.bench,
      ...player.hand,
      ...player.deck
    ].filter((card): card is PokemonCard => !!card);
  }

  private fallbackCard(): PokemonCard {
    return {
      id: 'victory-fallback',
      name: 'Champion Card',
      hp: 120,
      currentHp: 120,
      types: ['Colorless'],
      rarity: 'rare',
      imageUrl: '',
      accent: '#f5b700',
      attacks: [{ name: 'Final Strike', damage: 80, cost: ['Colorless'] }]
    };
  }

  private toPokemonType(type: string | undefined): PokemonType {
    const normalized = (type ?? 'colorless').toLowerCase();
    const map: Record<string, PokemonType> = {
      fire: 'fire',
      water: 'water',
      grass: 'grass',
      lightning: 'electric',
      electric: 'electric',
      psychic: 'psychic',
      fighting: 'fighting',
      darkness: 'dark',
      dark: 'dark',
      metal: 'metal',
      dragon: 'dragon',
      ice: 'ice',
      colorless: 'colorless',
      normal: 'normal'
    };
    return map[normalized] ?? 'colorless';
  }

  private animateTurnBanner(): void {
    const element = this.turnBanner?.nativeElement;
    if (!element) {
      return;
    }

    this.turnBannerTween?.kill();
    this.turnBannerTween = gsap.timeline()
      .fromTo(element, { y: -30, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.7)' })
      .to(element, { opacity: 0, y: -18, duration: 0.38, delay: 1.35, ease: 'power2.in' });
  }
}
