import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer
} from 'three';

@Component({
  selector: 'app-background-3d',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styles: [`
    :host {
      inset: 0;
      pointer-events: none;
      position: fixed;
      z-index: 0;
    }

    canvas {
      display: block;
      height: 100%;
      width: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Background3dComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() type = 'Normal';
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
  private readonly clock = new Clock();
  private readonly currentColor = new Color('#38bdf8');
  private readonly targetColor = new Color('#38bdf8');
  private readonly nebula: Mesh<PlaneGeometry, ShaderMaterial>;
  private readonly particles: Points<BufferGeometry, ShaderMaterial>;
  private readonly ovalPlane: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private renderer?: WebGLRenderer;
  private animationFrame = 0;
  private hidden = typeof document !== 'undefined' ? document.hidden : false;
  private reducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  constructor(private readonly zone: NgZone) {
    this.camera.position.z = 50;
    this.nebula = this.createNebula();
    this.particles = this.createParticleField();
    this.ovalPlane = this.createArenaPlane();
    this.scene.add(this.nebula, this.particles, this.ovalPlane);
  }

  ngAfterViewInit(): void {
    if (!this.hasWebGlSupport()) {
      return;
    }

    this.renderer = new WebGLRenderer({ canvas: this.canvasRef.nativeElement, alpha: true, antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.resize();
    this.updateColor();
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.zone.runOutsideAngular(() => this.animate());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      this.updateColor();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    cancelAnimationFrame(this.animationFrame);
    this.nebula.geometry.dispose();
    this.nebula.material.dispose();
    this.particles.geometry.dispose();
    this.particles.material.dispose();
    this.ovalPlane.geometry.dispose();
    this.ovalPlane.material.dispose();
    this.renderer?.dispose();
  }

  updateLightPosition(dx: number, dy: number): void {
    this.camera.position.x += (dx * 3 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-dy * 2 - this.camera.position.y) * 0.05;
    this.camera.lookAt(this.scene.position);
  }

  private readonly handleVisibilityChange = (): void => {
    this.hidden = document.hidden;
  };

  private readonly resize = (): void => {
    if (!this.renderer) {
      return;
    }

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  private hasWebGlSupport(): boolean {
    if (typeof WebGLRenderingContext === 'undefined') {
      return false;
    }

    const canvas = this.canvasRef.nativeElement;
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  }

  private createNebula(): Mesh<PlaneGeometry, ShaderMaterial> {
    const geometry = new PlaneGeometry(200, 200, 32, 32);
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        u_time: { value: 0 },
        u_color: { value: this.currentColor }
      },
      vertexShader: `
        varying vec2 v_uv;
        void main() {
          v_uv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float u_time;
        uniform vec3 u_color;
        varying vec2 v_uv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float smoothNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = noise(i);
          float b = noise(i + vec2(1.0, 0.0));
          float c = noise(i + vec2(0.0, 1.0));
          float d = noise(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * smoothNoise(p);
            p *= 2.2;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = v_uv - 0.5;
          float d = length(uv);
          float n = fbm(uv * 3.0 + vec2(u_time * 0.05, u_time * 0.03));
          float nebula = smoothstep(0.62, 0.0, d + n * 0.4) * 0.42;
          float vignette = 1.0 - smoothstep(0.3, 0.8, d);
          gl_FragColor = vec4(u_color, nebula * vignette);
        }
      `
    });
    const nebula = new Mesh(geometry, material);
    nebula.position.z = -10;
    return nebula;
  }

  private createParticleField(): Points<BufferGeometry, ShaderMaterial> {
    const count = window.innerWidth < 768 ? 150 : 300;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 120;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
      sizes[index] = Math.random() * 3 + 1;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('size', new BufferAttribute(sizes, 1));
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        u_color: { value: this.currentColor },
        u_time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        uniform float u_time;
        void main() {
          vec3 pos = position;
          pos.y += sin(u_time * 0.5 + position.x * 0.1) * 0.3;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -gl_Position.z);
        }
      `,
      fragmentShader: `
        uniform vec3 u_color;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.2, 0.5, d);
          gl_FragColor = vec4(u_color, alpha * 0.6);
        }
      `
    });
    return new Points(geometry, material);
  }

  private createArenaPlane(): Mesh<PlaneGeometry, MeshBasicMaterial> {
    const geometry = new PlaneGeometry(44, 14, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x38bdf8, opacity: 0.08, transparent: true });
    const plane = new Mesh(geometry, material);
    plane.position.set(0, -2.2, -15);
    plane.scale.set(1, 0.5, 1);
    return plane;
  }

  private updateColor(): void {
    const colorMap: Record<string, string> = {
      Fire: '#ff6b35',
      Water: '#38bdf8',
      Grass: '#4ade80',
      Lightning: '#fbbf24',
      Electric: '#fbbf24',
      Psychic: '#e879f9',
      Fighting: '#f97316',
      Darkness: '#6366f1',
      Metal: '#94a3b8',
      Dragon: '#7c3aed',
      Ice: '#67e8f9',
      Normal: '#cbd5e1'
    };
    this.targetColor.set(colorMap[this.type] ?? '#38bdf8');
  }

  private animate = (): void => {
    if (!this.renderer) {
      return;
    }

    this.animationFrame = requestAnimationFrame(this.animate);
    if (this.hidden) {
      return;
    }

    const time = this.clock.getElapsedTime();
    this.currentColor.lerp(this.targetColor, 0.025);
    this.ovalPlane.material.color = this.currentColor;

    if (!this.reducedMotion) {
      this.nebula.material.uniforms['u_time'].value = time;
      this.particles.material.uniforms['u_time'].value = time;
      this.nebula.rotation.z = Math.sin(time * 0.08) * 0.02;
      this.particles.rotation.y += 0.0007;
    }

    this.nebula.material.uniforms['u_color'].value = this.currentColor;
    this.particles.material.uniforms['u_color'].value = this.currentColor;
    this.renderer.render(this.scene, this.camera);
  };
}
