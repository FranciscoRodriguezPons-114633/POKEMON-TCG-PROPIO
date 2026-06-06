import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.gameServiceUrl}/api/auth`;
  private readonly tokenKey = 'pokemon_tcg_token';
  private readonly playerIdKey = 'pokemon_player_id';
  private readonly usernameKey = 'pokemon_username';
  private readonly tokenSubject = new BehaviorSubject<string | null>(this.getToken());

  readonly token$ = this.tokenSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.saveAuth(response))
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => this.saveAuth(response))
    );
  }

  logout(): void {
    this.storage()?.removeItem(this.tokenKey);
    this.storage()?.removeItem(this.playerIdKey);
    this.storage()?.removeItem(this.usernameKey);
    this.tokenSubject.next(null);
  }

  getToken(): string | null {
    return this.storage()?.getItem(this.tokenKey) ?? null;
  }

  getPlayerId(): number | null {
    const id = this.storage()?.getItem(this.playerIdKey);
    return id ? Number.parseInt(id, 10) : null;
  }

  getUsername(): string | null {
    return this.storage()?.getItem(this.usernameKey) ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private saveAuth(auth: AuthResponse): void {
    this.storage()?.setItem(this.tokenKey, auth.token);
    this.storage()?.setItem(this.playerIdKey, String(auth.playerId));
    this.storage()?.setItem(this.usernameKey, auth.username);
    this.tokenSubject.next(auth.token);
  }

  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
