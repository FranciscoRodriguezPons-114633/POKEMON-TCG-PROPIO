import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PokemonCard } from '../models/pokemon-card.model';

interface BackendCardListResponse {
  data: BackendCard[];
}

interface BackendCardResponse {
  data: BackendCard;
}

interface BackendCard {
  id?: string;
  name?: string;
  hp?: string | number;
  types?: string[];
  rarity?: string;
  images?: {
    small?: string;
    large?: string;
  };
  attacks?: BackendAttack[];
  weaknesses?: BackendRelation[];
  resistances?: BackendRelation[];
  retreatCost?: string[];
  supertype?: string;
  subtypes?: string[];
  evolvesFrom?: string;
  rules?: string[];
}

interface BackendAttack {
  name?: string;
  damage?: string | number;
  cost?: string[];
}

interface BackendRelation {
  type?: string;
}

const DEV_FALLBACK_XY1_CARDS: PokemonCard[] = [
  {
    id: 'xy1-12',
    name: 'Charmander',
    hp: 70,
    currentHp: 70,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/12.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Scratch', damage: 20, cost: ['Colorless'] }]
  },
  {
    id: 'xy1-13',
    name: 'Charmeleon',
    hp: 90,
    currentHp: 90,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/13.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Flame Tail', damage: 40, cost: ['Fire', 'Colorless'] }]
  },
  {
    id: 'xy1-14',
    name: 'Charizard',
    hp: 150,
    currentHp: 150,
    types: ['Fire'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/14.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Fire Blast', damage: 80, cost: ['Fire', 'Fire'] }]
  },
  {
    id: 'xy1-15',
    name: 'Fennekin',
    hp: 60,
    currentHp: 60,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/15.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Ember', damage: 30, cost: ['Fire'] }]
  },
  {
    id: 'xy1-16',
    name: 'Braixen',
    hp: 80,
    currentHp: 80,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/16.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Fire Spin', damage: 50, cost: ['Fire', 'Colorless'] }]
  },
  {
    id: 'xy1-17',
    name: 'Slugma',
    hp: 70,
    currentHp: 70,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/17.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Singe', damage: 20, cost: ['Fire'] }]
  },
  {
    id: 'xy1-18',
    name: 'Magcargo',
    hp: 110,
    currentHp: 110,
    types: ['Fire'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/18.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Lava Flow', damage: 60, cost: ['Fire', 'Colorless'] }]
  },
  {
    id: 'xy1-19',
    name: 'Ponyta',
    hp: 70,
    currentHp: 70,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/19.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Flare', damage: 20, cost: ['Fire'] }]
  },
  {
    id: 'xy1-20',
    name: 'Rapidash',
    hp: 100,
    currentHp: 100,
    types: ['Fire'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/20.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Agility', damage: 40, cost: ['Fire', 'Colorless'] }]
  },
  {
    id: 'xy1-21',
    name: 'Staryu',
    hp: 60,
    currentHp: 60,
    types: ['Water'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/21.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Water Gun', damage: 20, cost: ['Water'] }]
  },
  {
    id: 'xy1-22',
    name: 'Starmie',
    hp: 90,
    currentHp: 90,
    types: ['Water'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/22.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Hydro Splash', damage: 50, cost: ['Water', 'Colorless'] }]
  },
  {
    id: 'xy1-23',
    name: 'Froakie',
    hp: 60,
    currentHp: 60,
    types: ['Water'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/23.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Bubble', damage: 20, cost: ['Water'] }]
  },
  {
    id: 'xy1-24',
    name: 'Frogadier',
    hp: 80,
    currentHp: 80,
    types: ['Water'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/24.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Aqua Slash', damage: 40, cost: ['Water', 'Colorless'] }]
  },
  {
    id: 'xy1-25',
    name: 'Greninja',
    hp: 130,
    currentHp: 130,
    types: ['Water'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/25.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Water Shuriken', damage: 70, cost: ['Water', 'Colorless'] }]
  },
  {
    id: 'xy1-26',
    name: 'Pikachu',
    hp: 60,
    currentHp: 60,
    types: ['Lightning'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/26.png',
    accent: '#ffd84d',
    attacks: [{ name: 'Thunder Jolt', damage: 30, cost: ['Lightning'] }]
  },
  {
    id: 'xy1-27',
    name: 'Raichu',
    hp: 100,
    currentHp: 100,
    types: ['Lightning'],
    rarity: 'rare',
    imageUrl: 'https://images.pokemontcg.io/xy1/27.png',
    accent: '#ffd84d',
    attacks: [{ name: 'Thunderbolt', damage: 80, cost: ['Lightning', 'Colorless'] }]
  },
  {
    id: 'xy1-28',
    name: 'Trainer Potion',
    hp: 0,
    currentHp: 0,
    types: ['Colorless'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/28.png',
    accent: '#d1d5db',
    attacks: [],
    supertype: 'Trainer'
  },
  {
    id: 'xy1-29',
    name: 'Trainer Switch',
    hp: 0,
    currentHp: 0,
    types: ['Colorless'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/29.png',
    accent: '#d1d5db',
    attacks: [],
    supertype: 'Trainer'
  },
  {
    id: 'xy1-133',
    name: 'Fire Energy',
    hp: 0,
    currentHp: 0,
    types: ['Fire'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/133.png',
    accent: '#ff6a3d',
    attacks: [],
    supertype: 'Energy'
  },
  {
    id: 'xy1-134',
    name: 'Double Colorless Energy',
    hp: 0,
    currentHp: 0,
    types: ['Colorless'],
    rarity: 'common',
    imageUrl: 'https://images.pokemontcg.io/xy1/134.png',
    accent: '#d1d5db',
    attacks: [],
    supertype: 'Energy'
  }
];

@Injectable({ providedIn: 'root' })
export class CardApiService {
  private readonly baseUrl = `${environment.cardServiceUrl}/api/cards`;

  constructor(private readonly http: HttpClient) {}

  getCards(setId: string): Observable<PokemonCard[]> {
    return this.searchCards(setId, 200);
  }

  searchCards(setId = 'xy1', pageSize = 100): Observable<PokemonCard[]> {
    return this.http.get<BackendCardListResponse>(this.baseUrl, {
      params: {
        q: `set.id:${setId}`,
        pageSize: String(pageSize)
      }
    }).pipe(
      map((response) => response.data.map((card) => this.mapCardFromBackend(card))),
      catchError((error: unknown) => {
        console.error('No se pudo cargar el catalogo de cartas. Usando catalogo local de desarrollo:', error);
        return of(setId === 'xy1' ? this.fallbackCards(pageSize) : []);
      })
    );
  }

  getCardById(id: string): Observable<PokemonCard> {
    return this.http.get<BackendCardResponse>(`${this.baseUrl}/${id}`).pipe(
      map((response) => this.mapCardFromBackend(response.data)),
      catchError((error: unknown) => {
        console.error(`No se pudo cargar la carta ${id}:`, error);
        return of(this.emptyCard(id));
      })
    );
  }

  private mapCardFromBackend(card: BackendCard): PokemonCard {
    const hp = Number.parseInt(String(card.hp ?? ''), 10) || 100;
    const types = card.types?.length ? card.types : ['Colorless'];

    return {
      id: card.id ?? crypto.randomUUID(),
      name: card.name ?? 'Carta desconocida',
      hp,
      currentHp: hp,
      types,
      rarity: this.mapRarity(card['rarity']),
      imageUrl: card.images?.small ?? card.images?.large ?? '',
      accent: this.getTypeColor(types[0]),
      attacks: card.attacks?.map((attack) => ({
        name: attack.name ?? 'Ataque',
        damage: Number.parseInt(String(attack.damage ?? ''), 10) || 0,
        cost: attack.cost ?? []
      })) ?? [],
      weaknesses: card.weaknesses?.flatMap((weakness) => weakness.type ? [weakness.type] : []) ?? [],
      resistances: card.resistances?.flatMap((resistance) => resistance.type ? [resistance.type] : []) ?? [],
      retreatCost: card.retreatCost?.length ?? 0,
      supertype: card.supertype,
      subtypes: card.subtypes,
      evolvesFrom: card.evolvesFrom,
      rules: card.rules
    };
  }

  private emptyCard(id: string): PokemonCard {
    return {
      id,
      name: 'Carta no disponible',
      hp: 0,
      currentHp: 0,
      types: ['Colorless'],
      rarity: 'common',
      imageUrl: '',
      accent: '#8be9fd',
      attacks: []
    };
  }

  private fallbackCards(pageSize: number): PokemonCard[] {
    return DEV_FALLBACK_XY1_CARDS.slice(0, pageSize).map((card) => ({
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

  private mapRarity(rarity?: string): PokemonCard['rarity'] {
    const lower = rarity?.toLowerCase() ?? '';
    if (lower.includes('ex') || lower.includes('ultra') || lower.includes('secret')) {
      return 'ex';
    }
    if (lower.includes('rare')) {
      return 'rare';
    }
    return 'common';
  }

  private getTypeColor(type?: string): string {
    const map: Record<string, string> = {
      Fire: '#ff6a3d',
      Water: '#47a3ff',
      Grass: '#55d88a',
      Lightning: '#ffd84d',
      Psychic: '#c28cff',
      Fighting: '#6da6ff',
      Darkness: '#6b4c6b',
      Metal: '#b8b8d0',
      Dragon: '#ffb347',
      Fairy: '#f9a8d4',
      Colorless: '#d1d5db'
    };
    return map[type ?? ''] || '#8be9fd';
  }
}
