import { Injectable } from '@angular/core';
import { Howl } from 'howler';

type SoundId = 'draw' | 'attack' | 'damage' | 'heal' | 'ko' | 'win' | 'lose';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private enabled = true;
  private readonly sounds: Partial<Record<SoundId, Howl>> = {
    draw: new Howl({ src: ['/assets/sounds/draw.mp3'], volume: 0.35 }),
    attack: new Howl({ src: ['/assets/sounds/attack.mp3'], volume: 0.5 }),
    damage: new Howl({ src: ['/assets/sounds/damage.mp3'], volume: 0.48 }),
    heal: new Howl({ src: ['/assets/sounds/heal.mp3'], volume: 0.42 }),
    ko: new Howl({ src: ['/assets/sounds/ko.mp3'], volume: 0.56 }),
    win: new Howl({ src: ['/assets/sounds/win.mp3'], volume: 0.5 }),
    lose: new Howl({ src: ['/assets/sounds/lose.mp3'], volume: 0.5 })
  };

  play(soundId: SoundId): void {
    if (!this.enabled) {
      return;
    }

    this.sounds[soundId]?.play();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

