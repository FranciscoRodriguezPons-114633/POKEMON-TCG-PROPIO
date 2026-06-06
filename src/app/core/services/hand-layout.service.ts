import { Injectable } from '@angular/core';

export interface HandCardTransform {
  x: number;
  y: number;
  angle: number;
  z: number;
  zIndex: number;
}

@Injectable({ providedIn: 'root' })
export class HandLayoutService {
  getTransform(index: number, total: number): HandCardTransform {
    if (total <= 1) {
      return { x: 0, y: 0, angle: 0, z: 12, zIndex: 10 };
    }

    const t = total === 1 ? 0 : (index / (total - 1)) - 0.5;
    const maxAngle = Math.min(total * 7, 50);
    const arcRadius = 600;
    const yOffset = 420;
    const angleRadians = t * maxAngle * (Math.PI / 180);
    const x = Math.sin(angleRadians) * arcRadius;
    const y = yOffset - Math.cos(angleRadians) * arcRadius;
    const z = Math.cos(angleRadians * 2) * 10;

    return {
      x,
      y,
      angle: t * maxAngle,
      z,
      zIndex: Math.round(100 + z + index)
    };
  }

  toCssTransform(index: number, total: number): string {
    const transform = this.getTransform(index, total);
    return `translate3d(${transform.x}px, ${transform.y}px, ${transform.z}px) rotate(${transform.angle}deg)`;
  }
}
