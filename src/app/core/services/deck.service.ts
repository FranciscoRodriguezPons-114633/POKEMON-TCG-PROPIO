import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deck, DeckCard } from '../models/deck.model';

@Injectable({ providedIn: 'root' })
export class DeckService {
  private readonly apiUrl = `${environment.gameServiceUrl}/api/decks`;
  private readonly localKey = 'pokemon_local_decks';

  constructor(private readonly http: HttpClient) {}

  getDecks(): Observable<Deck[]> {
    return this.http.get<Deck[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.warn('No se pudieron cargar mazos remotos. Usando mazos locales.', error);
        return of(this.loadLocalDecks());
      })
    );
  }

  getDeck(deckId: number): Observable<Deck> {
    if (this.isLocalDeckId(deckId)) {
      const deck = this.loadLocalDecks().find((item) => item.id === deckId);
      return of(deck ?? this.emptyLocalDeck(deckId));
    }

    return this.http.get<Deck>(`${this.apiUrl}/${deckId}`).pipe(
      catchError((error) => {
        console.warn('No se pudo cargar el mazo remoto. Buscando fallback local.', error);
        const deck = this.loadLocalDecks().find((item) => item.id === deckId);
        return of(deck ?? this.emptyLocalDeck(deckId));
      })
    );
  }

  createDeck(deck: { name: string; cards: DeckCard[] }): Observable<Deck> {
    return this.http.post<Deck>(this.apiUrl, deck).pipe(
      catchError((error) => {
        console.warn('No se pudo guardar el mazo en backend. Guardando localmente.', error);
        return of(this.createLocalDeck(deck));
      })
    );
  }

  updateDeck(deckId: number, deck: { name?: string; cards?: DeckCard[] }): Observable<Deck> {
    if (this.isLocalDeckId(deckId)) {
      return of(this.updateLocalDeck(deckId, deck));
    }

    return this.http.put<Deck>(`${this.apiUrl}/${deckId}`, deck).pipe(
      catchError((error) => {
        console.warn('No se pudo actualizar el mazo remoto. Actualizando fallback local.', error);
        return of(this.updateLocalDeck(deckId, deck));
      })
    );
  }

  deleteDeck(deckId: number): Observable<void> {
    if (this.isLocalDeckId(deckId)) {
      this.deleteLocalDeck(deckId);
      return of(undefined);
    }

    return this.http.delete<void>(`${this.apiUrl}/${deckId}`).pipe(
      catchError((error) => {
        console.warn('No se pudo borrar el mazo remoto. Borrando fallback local.', error);
        this.deleteLocalDeck(deckId);
        return of(undefined);
      })
    );
  }

  isLocalDeck(deck: Deck): boolean {
    return this.isLocalDeckId(deck.id);
  }

  private isLocalDeckId(deckId: number): boolean {
    return deckId < 0;
  }

  private createLocalDeck(deck: { name: string; cards: DeckCard[] }): Deck {
    const decks = this.loadLocalDecks();
    const localDeck: Deck = {
      id: this.nextLocalId(decks),
      name: deck.name.trim() || 'Mazo local',
      playerId: 0,
      cards: deck.cards,
      coverCard: deck.cards[0] ? { name: deck.cards[0].cardId } : undefined
    };
    this.saveLocalDecks([...decks, localDeck]);
    return localDeck;
  }

  private updateLocalDeck(deckId: number, patch: { name?: string; cards?: DeckCard[] }): Deck {
    const decks = this.loadLocalDecks();
    const existing = decks.find((deck) => deck.id === deckId) ?? this.emptyLocalDeck(deckId);
    const updated: Deck = {
      ...existing,
      name: patch.name ?? existing.name,
      cards: patch.cards ?? existing.cards
    };
    this.saveLocalDecks([...decks.filter((deck) => deck.id !== deckId), updated]);
    return updated;
  }

  private deleteLocalDeck(deckId: number): void {
    this.saveLocalDecks(this.loadLocalDecks().filter((deck) => deck.id !== deckId));
  }

  private loadLocalDecks(): Deck[] {
    const raw = this.storage()?.getItem(this.localKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Deck[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private saveLocalDecks(decks: Deck[]): void {
    this.storage()?.setItem(this.localKey, JSON.stringify(decks));
  }

  private nextLocalId(decks: Deck[]): number {
    const minId = decks.reduce((min, deck) => Math.min(min, deck.id), 0);
    return minId - 1;
  }

  private emptyLocalDeck(deckId: number): Deck {
    return { id: deckId, name: 'Mazo local', playerId: 0, cards: [] };
  }

  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
