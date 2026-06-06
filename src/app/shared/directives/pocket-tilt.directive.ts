import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPocketTilt]',
  standalone: true
})
export class PocketTiltDirective implements OnDestroy {
  private readonly maxRotation = 12;
  private readonly transitionOut = 'transform 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)';
  private disabledState = false;

  @Input('appPocketTiltDisabled')
  set disabled(value: boolean) {
    this.disabledState = value;
    if (value) {
      const element = this.el.nativeElement;
      this.renderer.setStyle(element, '--mx', '50');
      this.renderer.setStyle(element, '--my', '50');
      this.renderer.removeStyle(element, 'transform');
      this.renderer.removeStyle(element, 'transition');
    }
  }

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.disabledState) {
      return;
    }

    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * this.maxRotation;
    const rotateY = (0.5 - x) * this.maxRotation;

    this.renderer.setStyle(element, 'transform', `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px)`);
    this.renderer.setStyle(element, '--mx', `${x * 100}`);
    this.renderer.setStyle(element, '--my', `${y * 100}`);
    this.renderer.setStyle(element, 'transition', 'transform 0.05s linear');
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.disabledState) {
      return;
    }

    const element = this.el.nativeElement;
    this.renderer.setStyle(element, 'transform', 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)');
    this.renderer.setStyle(element, '--mx', '50');
    this.renderer.setStyle(element, '--my', '50');
    this.renderer.setStyle(element, 'transition', this.transitionOut);
  }

  ngOnDestroy(): void {
    const element = this.el.nativeElement;
    this.renderer.removeStyle(element, 'transform');
    this.renderer.removeStyle(element, '--mx');
    this.renderer.removeStyle(element, '--my');
    this.renderer.removeStyle(element, 'transition');
  }
}
