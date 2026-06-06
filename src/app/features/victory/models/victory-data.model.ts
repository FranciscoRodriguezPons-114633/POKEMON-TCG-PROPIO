export type PokemonType =
  | 'fire'
  | 'water'
  | 'grass'
  | 'electric'
  | 'lightning'
  | 'psychic'
  | 'fighting'
  | 'dark'
  | 'darkness'
  | 'metal'
  | 'dragon'
  | 'ice'
  | 'colorless'
  | 'normal';

export interface VictoryData {
  winner: 'local' | 'opponent';
  winnerName: string;
  winnerAvatar?: string;
  winningCard: {
    id: string;
    name: string;
    imageUrl: string;
    type: PokemonType;
    currentHp: number;
    maxHp: number;
    isEX: boolean;
  };
  stats: {
    kos: number;
    rounds: number;
    prizesCollected: number;
    damageDealt: number;
  };
  rewards: {
    xpGained: number;
    levelBefore: number;
    levelAfter: number;
    xpBefore: number;
    xpAfter: number;
    packReward: boolean;
    packType?: 'gold' | 'silver' | 'standard';
  };
}
