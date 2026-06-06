import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { PokemonCard } from '../models/pokemon-card.model';
import { IGameService, LocalPlayerId } from './game-service.interface';

export interface LocalPlayer {
  hand: PokemonCard[];
  activePokemon: PokemonCard | null;
  bench: PokemonCard[];
  prizes: number;
  deck: PokemonCard[];
}

export interface LocalGameState {
  players: Record<LocalPlayerId, LocalPlayer>;
  currentTurn: LocalPlayerId;
  winner: LocalPlayerId | null;
  log: string[];
}

const EMPTY_PLAYER: LocalPlayer = {
  hand: [],
  activePokemon: null,
  bench: [],
  prizes: 3,
  deck: []
};

@Injectable({ providedIn: 'root' })
export class LocalGameService implements IGameService {
  private readonly stateSubject = new BehaviorSubject<LocalGameState>({
    players: {
      player1: { ...EMPTY_PLAYER },
      player2: { ...EMPTY_PLAYER }
    },
    currentTurn: 'player1',
    winner: null,
    log: []
  });

  readonly state$ = this.stateSubject.asObservable();
  readonly currentTurn$: Observable<LocalPlayerId> = this.state$.pipe(
    map((state) => state.currentTurn),
    distinctUntilChanged()
  );

  get snapshot(): LocalGameState {
    return this.stateSubject.value;
  }

  startLocalGame(deck1: PokemonCard[], deck2: PokemonCard[]): void {
    this.stateSubject.next({
      players: {
        player1: this.createPlayer(deck1),
        player2: this.createPlayer(deck2)
      },
      currentTurn: 'player1',
      winner: null,
      log: ['Partida local iniciada.']
    });
  }

  switchTurn(): void {
    const state = this.snapshot;
    if (state.winner) {
      return;
    }

    this.stateSubject.next({
      ...state,
      currentTurn: this.opponentOf(state.currentTurn),
      log: [`Turno de ${this.labelOf(this.opponentOf(state.currentTurn))}.`, ...state.log]
    });
  }

  playCard(playerId: LocalPlayerId, card: PokemonCard): void {
    const state = this.snapshot;
    const player = state.players[playerId];
    const hand = player.hand.filter((item) => item.id !== card.id);
    const playedCard = this.readyCard(card);
    const nextPlayer: LocalPlayer = player.activePokemon
      ? { ...player, hand, bench: player.bench.length < 5 ? [...player.bench, playedCard] : player.bench }
      : { ...player, hand, activePokemon: playedCard };

    this.patchPlayer(playerId, nextPlayer, `${this.labelOf(playerId)} jugo ${card.name}.`);
  }

  attackWith(attackIndex: number): void {
    const state = this.snapshot;
    if (state.winner) {
      return;
    }

    const attackerId = state.currentTurn;
    const defenderId = this.opponentOf(attackerId);
    const attacker = state.players[attackerId].activePokemon;
    const defender = state.players[defenderId].activePokemon;
    if (!attacker || !defender) {
      return;
    }

    const attack = attacker.attacks?.[attackIndex] ?? { name: 'Golpe rapido', damage: 20, cost: [] };
    const damage = Math.max(10, attack.damage || 20);
    const nextHp = Math.max(0, (defender.currentHp ?? defender.hp) - damage);
    const defenderPlayer = state.players[defenderId];
    const updatedDefender = { ...defender, currentHp: nextHp };
    const log = [`${attacker.name} uso ${attack.name} e hizo ${damage} de dano.`, ...state.log];

    if (nextHp > 0) {
      this.stateSubject.next({
        ...state,
        players: {
          ...state.players,
          [defenderId]: { ...defenderPlayer, activePokemon: updatedDefender }
        },
        log
      });
      this.switchTurn();
      return;
    }

    const promoted = defenderPlayer.bench[0] ? this.readyCard(defenderPlayer.bench[0]) : null;
    const nextDefender: LocalPlayer = {
      ...defenderPlayer,
      activePokemon: promoted,
      bench: defenderPlayer.bench.slice(1)
    };
    const nextAttacker: LocalPlayer = {
      ...state.players[attackerId],
      prizes: Math.max(0, state.players[attackerId].prizes - 1)
    };
    const winner = nextAttacker.prizes === 0 || (!promoted && nextDefender.deck.length === 0) ? attackerId : null;

    this.stateSubject.next({
      ...state,
      players: {
        ...state.players,
        [attackerId]: nextAttacker,
        [defenderId]: nextDefender
      },
      winner,
      log: [`${defender.name} quedo fuera de combate.`, ...log]
    });

    if (!winner) {
      this.switchTurn();
    }
  }

  drawCard(playerId: LocalPlayerId): void {
    const state = this.snapshot;
    const player = state.players[playerId];
    if (!player.deck.length) {
      this.stateSubject.next({
        ...state,
        winner: this.opponentOf(playerId),
        log: [`${this.labelOf(playerId)} no tiene mas cartas en el mazo.`, ...state.log]
      });
      return;
    }

    const [drawnCard, ...deck] = player.deck;
    this.patchPlayer(playerId, {
      ...player,
      deck,
      hand: [...player.hand, drawnCard]
    }, `${this.labelOf(playerId)} robo una carta.`);
  }

  private createPlayer(deck: PokemonCard[]): LocalPlayer {
    const preparedDeck = deck.map((card) => this.readyCard(card));
    const [activePokemon, ...remaining] = preparedDeck;
    return {
      hand: remaining.slice(0, 5),
      activePokemon: activePokemon ?? null,
      bench: [],
      prizes: 3,
      deck: remaining.slice(5)
    };
  }

  private patchPlayer(playerId: LocalPlayerId, player: LocalPlayer, message: string): void {
    const state = this.snapshot;
    this.stateSubject.next({
      ...state,
      players: {
        ...state.players,
        [playerId]: player
      },
      log: [message, ...state.log]
    });
  }

  private readyCard(card: PokemonCard): PokemonCard {
    return {
      ...card,
      currentHp: card.currentHp ?? card.hp,
      attacks: card.attacks?.length ? card.attacks : [{ name: 'Golpe rapido', damage: 20, cost: ['Colorless'] }]
    };
  }

  private opponentOf(playerId: LocalPlayerId): LocalPlayerId {
    return playerId === 'player1' ? 'player2' : 'player1';
  }

  private labelOf(playerId: LocalPlayerId): string {
    return playerId === 'player1' ? 'Jugador 1' : 'Jugador 2';
  }
}

