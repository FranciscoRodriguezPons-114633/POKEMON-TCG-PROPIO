export interface Game {
  id: number;
  status: 'WAITING' | 'SETUP' | 'ACTIVE' | 'FINISHED';
  currentTurn: 'PLAYER' | 'OPPONENT';
  players: GamePlayer[];
  winnerId?: number;
  turnNumber: number;
}

export interface GamePlayer {
  playerId: number;
  deckId: number;
  activePokemon?: PokemonInstance;
  bench: PokemonInstance[];
  prizeCardsLeft: number;
  handSize: number;
  discardPileSize: number;
}

export interface PokemonInstance {
  cardId: string;
  name: string;
  hp: number;
  currentHp: number;
  types: string[];
  attachedEnergy: EnergyAttachment[];
  statusConditions: string[];
  canEvolve?: boolean;
  retreatCost: number;
}

export interface EnergyAttachment {
  cardId: string;
  type: string;
}

export interface RealtimeGameEvent {
  gameId: number;
  sequence: number;
  type: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}

