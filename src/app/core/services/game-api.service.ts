import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Game } from '../models/game.model';
import { PokemonCard } from '../models/pokemon-card.model';

@Injectable({ providedIn: 'root' })
export class GameApiService {
  private readonly apiUrl = `${environment.gameServiceUrl}/api/games`;

  constructor(private readonly http: HttpClient) {}

  createGame(deckId: number): Observable<Game> {
    return this.http.post<Game>(this.apiUrl, { deckId });
  }

  joinGame(gameId: number, deckId: number): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/${gameId}/join`, { deckId });
  }

  getGame(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${gameId}`);
  }

  syncGame(gameId: number): Observable<Game> {
    return this.http.get<Game>(`${this.apiUrl}/${gameId}/sync`);
  }

  getHand(gameId: number, playerId: number): Observable<PokemonCard[]> {
    return this.http.get<PokemonCard[]>(`${this.apiUrl}/${gameId}/players/${playerId}/hand`);
  }

  placeActive(gameId: number, cardId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/setup/place-active`, { cardId });
  }

  placeBench(gameId: number, cardId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/setup/place-bench`, { cardId });
  }

  confirmSetup(gameId: number): Observable<Game> {
    return this.http.post<Game>(`${this.apiUrl}/${gameId}/setup/confirm`, {});
  }

  sendAction(gameId: number, actionType: string, payload?: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/${gameId}/actions`, { action: actionType, ...payload });
  }

  benchPokemon(gameId: number, cardId: string, position?: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/actions/bench-pokemon`, { cardId, position });
  }

  evolvePokemon(gameId: number, fromCardId: string, toCardId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/actions/evolve`, { fromCardId, toCardId });
  }

  playTrainer(gameId: number, cardId: string, target?: unknown): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/actions/play-trainer`, { cardId, target });
  }

  useAbility(gameId: number, pokemonCardId: string, abilityIndex: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${gameId}/actions/use-ability`, { pokemonCardId, abilityIndex });
  }
}

