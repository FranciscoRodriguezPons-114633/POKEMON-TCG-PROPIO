export interface Deck {
  id: number;
  name: string;
  playerId: number;
  cards: DeckCard[];
  coverCard?: {
    imageUrl?: string;
    name?: string;
  };
}

export interface DeckCard {
  cardId: string;
  quantity: number;
}
