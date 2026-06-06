import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { DeckService } from '../../core/services/deck.service';
import { RealGameService } from '../../core/services/real-game.service';
import { Deck } from '../../core/models/deck.model';

@Component({
  selector: 'app-backend-panel',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="panel">
      <div class="row">
        <input [(ngModel)]="username" placeholder="usuario" autocomplete="username">
        <input [(ngModel)]="password" placeholder="password" type="password" autocomplete="current-password">
        <button type="button" (click)="login()">Login</button>
        <button type="button" (click)="register()">Registro</button>
      </div>

      <div class="row">
        <button type="button" (click)="loadDecks()" [disabled]="!auth.isAuthenticated()">Mazos</button>
        <select [(ngModel)]="selectedDeckId">
          <option [ngValue]="null">Seleccionar mazo</option>
          <option *ngFor="let deck of decks()" [ngValue]="deck.id">{{ deck.name }} #{{ deck.id }}</option>
        </select>
        <input [(ngModel)]="gameId" placeholder="gameId" inputmode="numeric">
        <button type="button" (click)="createGame()" [disabled]="!selectedDeckId">Crear</button>
        <button type="button" (click)="joinGame()" [disabled]="!selectedDeckId || !gameId">Unirse</button>
        <button type="button" (click)="loadGame()" [disabled]="!gameId">Cargar</button>
      </div>

      <p *ngIf="message()" class="message">{{ message() }}</p>
      <p *ngIf="realGame.error()" class="error">{{ realGame.error() }}</p>
    </section>
  `,
  styles: [`
    .panel {
      background: rgb(5 10 20 / 0.68);
      border: 1px solid rgb(255 255 255 / 0.14);
      border-radius: 10px;
      display: grid;
      gap: 0.45rem;
      max-width: min(46rem, calc(100vw - 2rem));
      padding: 0.55rem;
      position: fixed;
      right: 1rem;
      top: 1rem;
      z-index: 45;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    input,
    select,
    button {
      border-radius: 7px;
      border: 1px solid rgb(255 255 255 / 0.18);
      font-size: 0.74rem;
      min-height: 2rem;
      padding: 0.38rem 0.52rem;
    }

    input,
    select {
      background: rgb(255 255 255 / 0.92);
      color: #0f172a;
      max-width: 9rem;
    }

    button {
      background: rgb(59 130 246 / 0.9);
      color: white;
      cursor: pointer;
      font-weight: 900;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    .message,
    .error {
      font-size: 0.72rem;
      font-weight: 800;
      margin: 0;
    }

    .message {
      color: #bfdbfe;
    }

    .error {
      color: #fecaca;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackendPanelComponent {
  username = '';
  password = '';
  gameId = '';
  selectedDeckId: number | null = null;
  readonly decks = signal<Deck[]>([]);
  readonly message = signal('');

  constructor(
    readonly auth: AuthService,
    readonly realGame: RealGameService,
    private readonly decksApi: DeckService
  ) {}

  login(): void {
    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: () => this.message.set(`Logueado como ${this.username}`),
      error: () => this.message.set('No se pudo iniciar sesion')
    });
  }

  register(): void {
    this.auth.register({ username: this.username, password: this.password }).subscribe({
      next: () => this.message.set(`Usuario creado: ${this.username}`),
      error: () => this.message.set('No se pudo registrar')
    });
  }

  loadDecks(): void {
    this.decksApi.getDecks().subscribe({
      next: (decks) => {
        this.decks.set(decks);
        this.selectedDeckId = decks[0]?.id ?? null;
        this.message.set(`${decks.length} mazos cargados`);
      },
      error: () => this.message.set('No se pudieron cargar mazos')
    });
  }

  createGame(): void {
    if (!this.selectedDeckId) {
      return;
    }

    void this.realGame.createGame(this.selectedDeckId).then(() => {
      this.gameId = String(this.realGame.currentGame()?.id ?? '');
      this.message.set(`Partida creada #${this.gameId}`);
    }).catch(() => undefined);
  }

  joinGame(): void {
    if (!this.selectedDeckId || !this.gameId) {
      return;
    }

    void this.realGame.joinGame(Number(this.gameId), this.selectedDeckId).then(() => {
      this.message.set(`Unido a partida #${this.gameId}`);
    }).catch(() => undefined);
  }

  loadGame(): void {
    if (!this.gameId) {
      return;
    }

    void this.realGame.loadGame(Number(this.gameId)).then(() => {
      this.message.set(`Partida #${this.gameId} cargada`);
    }).catch(() => undefined);
  }
}

