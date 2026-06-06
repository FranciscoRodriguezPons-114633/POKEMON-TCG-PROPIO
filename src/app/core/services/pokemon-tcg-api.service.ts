import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PokemonCard } from '../models/pokemon-card.model';

interface PokemonTcgResponse {
  data: Array<{
    id: string;
    name: string;
    hp?: string;
    types?: string[];
    rarity?: string;
    images?: { small?: string; large?: string };
    attacks?: Array<{ name: string; damage?: string; cost?: string[] }>;
  }>;
}

const FALLBACK_CARDS: PokemonCard[] = [
  {
    id: 'charizard-ex',
    name: 'Charizard ex',
    hp: 180,
    currentHp: 180,
    types: ['Fire'],
    rarity: 'ex',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    accent: '#ff6a3d',
    attacks: [{ name: 'Crimson Storm', damage: 70, cost: ['Fire', 'Fire'] }]
  },
  {
    id: 'blastoise',
    name: 'Blastoise',
    hp: 160,
    currentHp: 160,
    types: ['Water'],
    rarity: 'rare',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
    accent: '#47a3ff',
    attacks: [{ name: 'Hydro Pump', damage: 60, cost: ['Water', 'Water'] }]
  },
  {
    id: 'venusaur',
    name: 'Venusaur',
    hp: 170,
    currentHp: 170,
    types: ['Grass'],
    rarity: 'rare',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
    accent: '#55d88a',
    attacks: [{ name: 'Solar Bloom', damage: 55, cost: ['Grass', 'Colorless'] }]
  },
  {
    id: 'pikachu',
    name: 'Pikachu',
    hp: 90,
    currentHp: 90,
    types: ['Lightning'],
    rarity: 'common',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    accent: '#ffd84d',
    attacks: [{ name: 'Quick Bolt', damage: 35, cost: ['Lightning'] }]
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    hp: 160,
    currentHp: 160,
    types: ['Psychic'],
    rarity: 'ex',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    accent: '#c28cff',
    attacks: [{ name: 'Psy Break', damage: 65, cost: ['Psychic', 'Colorless'] }]
  },
  {
    id: 'lucario',
    name: 'Lucario',
    hp: 130,
    currentHp: 130,
    types: ['Fighting'],
    rarity: 'rare',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
    accent: '#6da6ff',
    attacks: [{ name: 'Aura Strike', damage: 50, cost: ['Fighting'] }]
  },
  {
    id: 'gengar',
    name: 'Gengar',
    hp: 140,
    currentHp: 140,
    types: ['Psychic'],
    rarity: 'rare',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
    accent: '#9b67ff',
    attacks: [{ name: 'Shadow Drop', damage: 45, cost: ['Psychic'] }]
  },
  {
    id: 'dragonite',
    name: 'Dragonite',
    hp: 170,
    currentHp: 170,
    types: ['Dragon'],
    rarity: 'rare',
    imageUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png',
    accent: '#ffb347',
    attacks: [{ name: 'Dragon Wave', damage: 75, cost: ['Water', 'Lightning'] }]
  }
];

@Injectable({ providedIn: 'root' })
export class PokemonTcgApiService {
  private readonly apiUrl = 'https://api.pokemontcg.io/v2';

  constructor(private readonly http: HttpClient) {}

  getRandomCards(count = 20): Observable<PokemonCard[]> {
    const page = Math.floor(Math.random() * 40) + 1;
    const headers = environment.pokemonTcgApiKey
      ? new HttpHeaders({ 'X-Api-Key': environment.pokemonTcgApiKey })
      : undefined;

    return this.http.get<PokemonTcgResponse>(`${this.apiUrl}/cards`, {
      headers,
      params: {
        page: String(page),
        pageSize: String(count),
        q: 'supertype:Pokémon'
      }
    }).pipe(
      map((response) => response.data.map((card) => this.mapCard(card)).filter((card) => card.imageUrl)),
      map((cards) => cards.length >= 8 ? cards : this.fallback(count)),
      catchError(() => of(this.fallback(count)))
    );
  }

  private mapCard(card: PokemonTcgResponse['data'][number]): PokemonCard {
    const hp = Number.parseInt(card.hp ?? '', 10) || 100;
    const type = card.types?.[0] ?? 'Normal';

    return {
      id: card.id,
      name: card.name,
      hp,
      currentHp: hp,
      types: card.types?.length ? card.types : ['Normal'],
      rarity: this.getRarity(card.rarity),
      imageUrl: card.images?.small ?? card.images?.large ?? '',
      accent: this.getTypeAccent(type),
      attacks: card.attacks?.map((attack) => ({
        name: attack.name,
        damage: Number.parseInt(attack.damage ?? '', 10) || 20,
        cost: attack.cost ?? []
      })) ?? [{ name: 'Tackle', damage: 20, cost: ['Colorless'] }]
    };
  }

  private fallback(count: number): PokemonCard[] {
    const cards = [...FALLBACK_CARDS];
    while (cards.length < count) {
      cards.push(...FALLBACK_CARDS.map((card, index) => ({ ...card, id: `${card.id}-${cards.length}-${index}` })));
    }
    return cards.slice(0, count).map((card) => ({ ...card, currentHp: card.hp }));
  }

  private getRarity(rarity = ''): PokemonCard['rarity'] {
    const normalized = rarity.toLowerCase();
    if (normalized.includes('ex') || normalized.includes('ultra') || normalized.includes('secret')) {
      return 'ex';
    }
    if (normalized.includes('rare')) {
      return 'rare';
    }
    return 'common';
  }

  private getTypeAccent(type: string): string {
    const accents: Record<string, string> = {
      Fire: '#ff6a3d',
      Water: '#47a3ff',
      Grass: '#55d88a',
      Lightning: '#ffd84d',
      Psychic: '#c28cff',
      Fighting: '#d99a5f',
      Darkness: '#8b6b91',
      Metal: '#b8c0d0',
      Dragon: '#ffb347',
      Colorless: '#a8a8a8',
      Normal: '#a8a8a8'
    };
    return accents[type] || '#8be9fd';
  }
}

