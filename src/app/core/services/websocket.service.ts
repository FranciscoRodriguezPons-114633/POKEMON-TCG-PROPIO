import { Injectable, OnDestroy } from '@angular/core';
import { Client, Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RealtimeGameEvent } from '../models/game.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly connectedSubject = new BehaviorSubject<boolean>(false);
  private readonly subscriptions = new Map<string, StompSubscription>();
  private readonly client: Client;

  readonly connected$ = this.connectedSubject.asObservable();

  constructor(private readonly auth: AuthService) {
    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: this.getHeaders()
    });
  }

  connect(): void {
    if (this.client.active || this.client.connected) {
      return;
    }

    this.client.connectHeaders = this.getHeaders();
    this.client.onConnect = () => this.connectedSubject.next(true);
    this.client.onDisconnect = () => this.connectedSubject.next(false);
    this.client.onWebSocketClose = () => this.connectedSubject.next(false);
    this.client.onStompError = (frame) => console.error('STOMP error', frame.headers['message'], frame.body);
    this.client.activate();
  }

  disconnect(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();
    this.connectedSubject.next(false);
    void this.client.deactivate();
  }

  subscribeToGame(gameId: number, onEvent: (event: RealtimeGameEvent) => void): void {
    const topic = `/topic/games/${gameId}/events`;
    if (this.subscriptions.has(topic)) {
      return;
    }

    const subscribe = (): void => {
      const subscription = this.client.subscribe(topic, (message: Message) => {
        onEvent(JSON.parse(message.body) as RealtimeGameEvent);
      }, this.getHeaders());
      this.subscriptions.set(topic, subscription);
    };

    if (this.client.connected) {
      subscribe();
      return;
    }

    this.client.onConnect = () => {
      this.connectedSubject.next(true);
      subscribe();
    };
    this.connect();
  }

  unsubscribeFromGame(gameId: number): void {
    const topic = `/topic/games/${gameId}/events`;
    this.subscriptions.get(topic)?.unsubscribe();
    this.subscriptions.delete(topic);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private getHeaders(): Record<string, string> {
    const token = this.auth.getToken();
    const playerId = this.auth.getPlayerId();
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(playerId ? { playerId: String(playerId) } : {})
    };
  }
}

