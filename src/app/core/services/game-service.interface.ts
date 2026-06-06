import { Observable } from 'rxjs';
import { PokemonCard } from '../models/pokemon-card.model';

export type LocalPlayerId = 'player1' | 'player2';

export interface IGameService {
  readonly currentTurn$: Observable<LocalPlayerId>;
  switchTurn(): void;
  playCard(playerId: LocalPlayerId, card: PokemonCard): void;
  attackWith(attackIndex: number): void;
  drawCard(playerId: LocalPlayerId): void;
}

