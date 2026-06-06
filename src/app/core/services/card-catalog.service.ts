import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PokemonCard } from '../models/pokemon-card.model';
import { CardApiService } from './card-api.service';

@Injectable({ providedIn: 'root' })
export class CardCatalogService {
  constructor(private readonly cards: CardApiService) {}

  searchSet(setId = 'xy1', pageSize = 100): Observable<PokemonCard[]> {
    return this.cards.searchCards(setId, pageSize);
  }

  getCard(id: string): Observable<PokemonCard> {
    return this.cards.getCardById(id);
  }
}

