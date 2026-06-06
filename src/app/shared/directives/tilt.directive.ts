import { Directive, ElementRef, HostListener, Input, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTilt]'
})
export class TiltDirective implements OnDestroy {
  @Input() strength = 12;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly renderer: Renderer2
  ) {}

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const element = this.el.nativeElement;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -this.strength;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * this.strength;

    this.renderer.setStyle(element, '--mouse-x', `${(x / rect.width) * 100}%`);
    this.renderer.setStyle(element, '--mouse-y', `${(y / rect.height) * 100}%`);
    this.renderer.setStyle(element, 'transform', `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(14px)`);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(this.el.nativeElement, 'transform', 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)');
  }

  ngOnDestroy(): void {
    this.renderer.removeStyle(this.el.nativeElement, 'transform');
    this.renderer.removeStyle(this.el.nativeElement, '--mouse-x');
    this.renderer.removeStyle(this.el.nativeElement, '--mouse-y');
  }
}
