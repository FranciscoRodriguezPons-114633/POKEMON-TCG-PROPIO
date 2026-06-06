import { computed, Injectable, signal } from '@angular/core';
import { Attack, PokemonCard } from '../models/pokemon-card.model';
import { AudioService } from './audio.service';
import { FxService } from './fx.service';

interface PlayerState {
  deck: PokemonCard[];
  hand: PokemonCard[];
  active: PokemonCard | null;
  bench: PokemonCard[];
  discard: PokemonCard[];
  prizeCards: PokemonCard[];
  prizeCount: number;
}

const EMPTY_PLAYER: PlayerState = {
  deck: [],
  hand: [],
  active: null,
  bench: [],
  discard: [],
  prizeCards: [],
  prizeCount: 0
};

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly playerSignal = signal<PlayerState>(EMPTY_PLAYER);
  private readonly opponentSignal = signal<PlayerState>(EMPTY_PLAYER);

  readonly turn = signal<'player' | 'opponent'>('player');
  readonly energy = signal(1);
  readonly gameOver = signal<'player' | 'opponent' | null>(null);
  readonly loading = signal(true);

  readonly playerState = computed(() => this.playerSignal());
  readonly opponentState = computed(() => this.opponentSignal());
  readonly playerHand = computed(() => this.playerSignal().hand);
  readonly playerBench = computed(() => this.playerSignal().bench);
  readonly opponentBench = computed(() => this.opponentSignal().bench);
  readonly playerActive = computed(() => this.playerSignal().active);
  readonly opponentActive = computed(() => this.opponentSignal().active);
  readonly activePokemon = computed(() => this.playerSignal().active);
  readonly playerDeckCount = computed(() => this.playerSignal().deck.length);
  readonly playerPrizeCount = computed(() => this.playerSignal().prizeCount);
  readonly opponentPrizeCount = computed(() => this.opponentSignal().prizeCount);
  readonly canAct = computed(() => this.turn() === 'player' && !this.gameOver() && !this.loading());

  constructor(
    private readonly fx: FxService,
    private readonly audio: AudioService
  ) {}

  initGame(deckCards: PokemonCard[]): void {
    const normalizedCards = deckCards.map((card) => this.readyCard(card));
    const playerDeck = this.shuffle(normalizedCards);
    const opponentDeck = this.shuffle(normalizedCards.map((card) => ({ ...card, id: `opp-${card.id}` })));

    this.playerSignal.set(this.createPlayer(playerDeck));
    this.opponentSignal.set(this.createPlayer(opponentDeck));
    this.turn.set('player');
    this.energy.set(1);
    this.gameOver.set(null);
    this.loading.set(false);
  }

  drawCard(origin?: { x: number; y: number }): void {
    if (!this.canAct()) {
      return;
    }

    const current = this.playerSignal();
    if (current.deck.length === 0) {
      this.finishGame('opponent');
      return;
    }

    const [newCard, ...deck] = current.deck;
    const from = this.centerOf('deck') ?? origin ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.8 };
    const to = this.centerOf('hand-area') ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.82 };
    this.fx.cardFly(from.x, from.y, to.x, to.y, newCard.id);
    this.playerSignal.set({ ...current, deck, hand: [...current.hand, newCard] });
    this.fx.draw(from.x, from.y);
    this.audio.play('draw');
  }

  setActivePokemon(card: PokemonCard, origin?: { x: number; y: number }): void {
    if (!this.canAct()) {
      return;
    }

    const current = this.playerSignal();
    const exists = current.hand.some((item) => item.id === card.id) || current.bench.some((item) => item.id === card.id);
    if (!exists) {
      return;
    }

    const previousActive = current.active;
    const nextActive = this.readyCard(card);
    const hand = current.hand.filter((item) => item.id !== card.id);
    const bench = current.bench.filter((item) => item.id !== card.id);
    const nextBench = previousActive ? [...bench, previousActive].slice(0, 5) : bench;

    this.playerSignal.set({ ...current, hand, bench: nextBench, active: nextActive });
    this.fx.draw(origin?.x ?? window.innerWidth * 0.5, origin?.y ?? window.innerHeight * 0.66);
    this.audio.play('draw');
  }

  attack(index: number): void {
    if (!this.canAct()) {
      return;
    }

    const attacker = this.playerSignal().active;
    const defender = this.opponentSignal().active;
    const attack = attacker?.attacks?.[index];
    if (!attacker || !defender || !attack) {
      return;
    }

    const cost = this.getEnergyCost(attack);
    if (this.energy() < cost) {
      this.fx.emit({ type: 'damage', value: 0, x: window.innerWidth * 0.5, y: window.innerHeight * 0.48 });
      return;
    }

    const damage = this.calculateDamage(attacker, defender, attack);
    const attackerId = `card-${attacker.id}`;
    const defenderId = `card-${defender.id}`;
    const attackerCenter = this.centerOf(attackerId) ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.62 };
    const defenderCenter = this.centerOf(defenderId) ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.36 };
    this.fx.attackStart(attackerCenter.x, attackerCenter.y, attackerId);

    const nextHp = Math.max(0, (defender.currentHp ?? defender.hp) - damage);
    this.energy.update((value) => Math.max(0, value - cost));
    this.audio.play('attack');

    window.setTimeout(() => {
      this.opponentSignal.update((opponent) => ({ ...opponent, active: { ...defender, currentHp: nextHp } }));
      this.fx.attackImpact(defenderCenter.x, defenderCenter.y, attacker.types[0], defenderId);
      this.fx.damage(damage, defenderCenter.x, defenderCenter.y);
      this.audio.play('damage');

      if (nextHp <= 0) {
        this.fx.ko(defenderCenter.x, defenderCenter.y, defenderId);
        this.handleKo('opponent');
      }

      if (!this.gameOver()) {
        this.endTurn();
      }
    }, 280);
  }

  endTurn(): void {
    if (this.gameOver() || this.loading()) {
      return;
    }

    this.turn.update((turn) => turn === 'player' ? 'opponent' : 'player');
    if (this.turn() === 'player') {
      this.energy.update((value) => Math.min(10, value + 1));
      return;
    }

    window.setTimeout(() => this.simulateOpponentTurn(), 850);
  }

  restart(cards: PokemonCard[]): void {
    this.loading.set(true);
    this.initGame(cards);
  }

  private simulateOpponentTurn(): void {
    if (this.turn() !== 'opponent' || this.gameOver()) {
      return;
    }

    const attacker = this.opponentSignal().active;
    const defender = this.playerSignal().active;
    const attack = attacker?.attacks?.[0];
    if (!attacker || !defender || !attack) {
      this.endTurn();
      return;
    }

    const damage = this.calculateDamage(attacker, defender, attack);
    const attackerId = `card-${attacker.id}`;
    const defenderId = `card-${defender.id}`;
    const attackerCenter = this.centerOf(attackerId) ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.36 };
    const defenderCenter = this.centerOf(defenderId) ?? { x: window.innerWidth * 0.5, y: window.innerHeight * 0.62 };
    this.fx.attackStart(attackerCenter.x, attackerCenter.y, attackerId);
    const nextHp = Math.max(0, (defender.currentHp ?? defender.hp) - damage);

    window.setTimeout(() => {
      this.playerSignal.update((player) => ({ ...player, active: { ...defender, currentHp: nextHp } }));
      this.fx.attackImpact(defenderCenter.x, defenderCenter.y, attacker.types[0], defenderId);
      this.fx.damage(damage, defenderCenter.x, defenderCenter.y);
      this.audio.play('damage');

      if (nextHp <= 0) {
        this.fx.ko(defenderCenter.x, defenderCenter.y, defenderId);
        this.handleKo('player');
      }

      if (!this.gameOver()) {
        this.endTurn();
      }
    }, 280);
  }

  private handleKo(side: 'player' | 'opponent'): void {
    this.audio.play('ko');
    const target = side === 'player' ? this.playerSignal : this.opponentSignal;
    const koState = target();
    const active = koState.active;
    if (!active) {
      return;
    }

    const [replacement, ...bench] = koState.bench;
    target.set({
      ...koState,
      active: replacement ? this.readyCard(replacement) : null,
      bench,
      discard: [...koState.discard, active]
    });

    const winner = side === 'player' ? 'opponent' : 'player';
    if (side === 'opponent') {
      this.takePrize();
    }

    const updatedTarget = target();
    if (!updatedTarget.active || (winner === 'player' && this.playerSignal().prizeCount <= 0)) {
      this.finishGame(winner);
    }
  }

  private takePrize(): void {
    const current = this.playerSignal();
    const [prize, ...prizeCards] = current.prizeCards;
    if (!prize) {
      return;
    }

    this.playerSignal.set({
      ...current,
      prizeCards,
      prizeCount: Math.max(0, current.prizeCount - 1),
      hand: [...current.hand, prize]
    });
    this.fx.draw(window.innerWidth * 0.5, window.innerHeight * 0.18);
    this.audio.play('draw');
  }

  private finishGame(winner: 'player' | 'opponent'): void {
    this.gameOver.set(winner);
    this.audio.play(winner === 'player' ? 'win' : 'lose');
  }

  private centerOf(elementId: string): { x: number; y: number } | null {
    const element = document.getElementById(elementId);
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }

  private createPlayer(deck: PokemonCard[]): PlayerState {
    const active = deck[0] ? this.readyCard(deck[0]) : null;
    return {
      deck: deck.slice(7),
      hand: deck.slice(4, 7).map((card) => this.readyCard(card)),
      active,
      bench: deck.slice(1, 4).map((card) => this.readyCard(card)),
      discard: [],
      prizeCards: deck.slice(7, 13).map((card) => this.readyCard(card)),
      prizeCount: 6
    };
  }

  private readyCard(card: PokemonCard): PokemonCard {
    return {
      ...card,
      currentHp: card.currentHp ?? card.hp,
      attacks: card.attacks?.length ? card.attacks : [{ name: 'Tackle', damage: 20, cost: ['Colorless'] }]
    };
  }

  private calculateDamage(attacker: PokemonCard, defender: PokemonCard, attack: Attack): number {
    const weaknessMap: Record<string, string[]> = {
      Fire: ['Grass', 'Metal'],
      Water: ['Fire', 'Fighting'],
      Grass: ['Water', 'Lightning'],
      Lightning: ['Water', 'Dragon'],
      Psychic: ['Fighting', 'Psychic'],
      Fighting: ['Colorless', 'Darkness'],
      Darkness: ['Psychic'],
      Metal: ['Dragon']
    };

    const baseDamage = Math.max(10, attack.damage);
    return weaknessMap[attacker.types[0]]?.includes(defender.types[0]) ? baseDamage * 2 : baseDamage;
  }

  private getEnergyCost(attack: Attack): number {
    return Math.max(1, Math.min(3, attack.cost.length || 1));
  }

  private shuffle(cards: PokemonCard[]): PokemonCard[] {
    return [...cards]
      .map((card) => ({ card, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ card }) => ({ ...card }));
  }
}
