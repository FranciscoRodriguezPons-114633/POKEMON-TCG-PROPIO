import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHolographicShader]',
  standalone: true
})
export class HolographicShaderDirective implements OnChanges, OnDestroy {
  @Input('appHolographicShader') enabled = false;

  private canvas?: HTMLCanvasElement;
  private gl?: WebGLRenderingContext;
  private program?: WebGLProgram;
  private vertexBuffer?: WebGLBuffer;
  private animationFrame = 0;
  private unlistenMouse?: () => void;
  private mouseX = 0.5;
  private mouseY = 0.5;
  private startTime = performance.now();

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2,
    private readonly zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enabled']) {
      this.enabled ? this.start() : this.stop();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private start(): void {
    if (this.canvas || typeof WebGLRenderingContext === 'undefined') {
      return;
    }

    const canvas = this.renderer.createElement('canvas') as HTMLCanvasElement;
    this.renderer.addClass(canvas, 'holo-shader-canvas');
    this.renderer.appendChild(this.host.nativeElement, canvas);
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl') ?? undefined;
    if (!this.gl) {
      this.stop();
      return;
    }

    this.resize();
    this.program = this.createProgram(this.gl);
    if (!this.program) {
      this.stop();
      return;
    }

    this.vertexBuffer = this.gl.createBuffer() ?? undefined;
    this.unlistenMouse = this.renderer.listen(this.host.nativeElement, 'mousemove', (event: MouseEvent) => this.updateMouse(event));
    this.zone.runOutsideAngular(() => this.render());
  }

  private stop(): void {
    cancelAnimationFrame(this.animationFrame);
    this.unlistenMouse?.();
    if (this.gl && this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
    }
    if (this.canvas) {
      this.renderer.removeChild(this.host.nativeElement, this.canvas);
    }
    this.canvas = undefined;
    this.program = undefined;
    this.vertexBuffer = undefined;
    this.gl = undefined;
  }

  private updateMouse(event: MouseEvent): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    this.mouseX = (event.clientX - rect.left) / Math.max(rect.width, 1);
    this.mouseY = 1 - ((event.clientY - rect.top) / Math.max(rect.height, 1));
  }

  private resize(): void {
    if (!this.canvas) {
      return;
    }

    const rect = this.host.nativeElement.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    this.canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  }

  private createProgram(gl: WebGLRenderingContext): WebGLProgram | undefined {
    const vertexShader = this.compile(gl, gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);
    const fragmentShader = this.compile(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform vec2 u_mouse;
      uniform float u_time;
      varying vec2 v_uv;

      void main() {
        vec2 uv = v_uv;
        float rainbow = sin((uv.x + uv.y + u_mouse.x * 0.3 + u_time * 0.1) * 8.0) * 0.5 + 0.5;
        vec3 rainbowColor = vec3(
          sin(rainbow * 6.28318) * 0.5 + 0.5,
          sin(rainbow * 6.28318 + 2.09) * 0.5 + 0.5,
          sin(rainbow * 6.28318 + 4.19) * 0.5 + 0.5
        );
        float spec = pow(max(0.0, 1.0 - distance(uv, u_mouse)), 4.0) * 0.8;
        float scan = step(0.88, fract((uv.y + u_time * 0.03) * 42.0)) * 0.12;
        vec3 foil = rainbowColor * (0.22 + spec * 0.42 + scan);
        gl_FragColor = vec4(foil, 0.28 + spec * 0.46);
      }
    `);
    if (!vertexShader || !fragmentShader) {
      return undefined;
    }

    const program = gl.createProgram();
    if (!program) {
      return undefined;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : undefined;
  }

  private compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | undefined {
    const shader = gl.createShader(type);
    if (!shader) {
      return undefined;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : undefined;
  }

  private render = (): void => {
    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.canvas || document.hidden) {
      this.animationFrame = requestAnimationFrame(this.render);
      return;
    }

    this.resize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    if (!this.vertexBuffer) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(gl.getUniformLocation(program, 'u_mouse'), this.mouseX, this.mouseY);
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), (performance.now() - this.startTime) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.animationFrame = requestAnimationFrame(this.render);
  };
}
