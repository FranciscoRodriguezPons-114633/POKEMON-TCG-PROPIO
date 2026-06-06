export interface Attack {
  name: string;
  damage: number;
  cost: string[];
}

export interface PokemonCard {
  id: string;
  name: string;
  hp: number;
  types: string[];
  rarity: 'common' | 'rare' | 'ex';
  imageUrl: string;
  accent: string;
  attacks?: Attack[];
  currentHp?: number;
  weaknesses?: string[];
  resistances?: string[];
  retreatCost?: number;
  supertype?: string;
  subtypes?: string[];
  evolvesFrom?: string;
  rules?: string[];
}
