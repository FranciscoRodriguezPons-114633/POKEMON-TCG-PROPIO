import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type FxEventType =
  | 'damage'
  | 'heal'
  | 'draw'
  | 'attack_start'
  | 'attack_impact'
  | 'energy_attach'
  | 'evolve'
  | 'retreat'
  | 'ko'
  | 'shake'
  | 'flash'
  | 'card_fly'
  | 'status_effect';

export interface FxEvent {
  type: FxEventType;
  value?: number;
  x: number;
  y: number;
  elementId?: string;
  attackType?: string;
  fromX?: number;
  fromY?: number;
  cardId?: string;
  status?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class FxService {
  private readonly eventsSubject = new Subject<FxEvent>();
  readonly events$ = this.eventsSubject.asObservable();

  emit(event: FxEvent): void {
    this.eventsSubject.next(event);
  }

  damage(value: number, x: number, y: number): void {
    this.emit({ type: 'damage', value, x, y });
  }

  heal(value: number, x: number, y: number): void {
    this.emit({ type: 'heal', value, x, y });
  }

  draw(x: number, y: number): void {
    this.emit({ type: 'draw', x, y });
  }

  attackStart(x: number, y: number, elementId?: string): void {
    this.emit({ type: 'attack_start', x, y, elementId });
  }

  attackImpact(x: number, y: number, attackType?: string, elementId?: string): void {
    this.emit({ type: 'attack_impact', x, y, attackType, elementId });
  }

  energyAttach(x: number, y: number, elementId?: string): void {
    this.emit({ type: 'energy_attach', x, y, elementId });
  }

  evolve(x: number, y: number, elementId?: string): void {
    this.emit({ type: 'evolve', x, y, elementId });
  }

  retreat(x: number, y: number, elementId?: string): void {
    this.emit({ type: 'retreat', x, y, elementId });
  }

  ko(x: number, y: number, elementId?: string): void {
    this.emit({ type: 'ko', x, y, elementId });
  }

  shake(elementId: string): void {
    this.emit({ type: 'shake', x: 0, y: 0, elementId });
  }

  flash(x: number, y: number): void {
    this.emit({ type: 'flash', x, y });
  }

  cardFly(fromX: number, fromY: number, toX: number, toY: number, cardId: string): void {
    this.emit({ type: 'card_fly', x: toX, y: toY, fromX, fromY, cardId });
  }

  startStatusEffect(elementId: string, status: string, duration: number): void {
    this.emit({ type: 'status_effect', x: 0, y: 0, elementId, status, duration });
  }
}

