import { Component, effect, inject, signal, computed, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnboardingService } from '../../core/onboarding.service';
import { AppButtonComponent } from './button.component';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, AppButtonComponent],
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        (click)="onBackdropClick()"
      ></div>

      @if (targetRect() && currentStep()) {
        <div
          class="fixed z-[61] pointer-events-none transition-all duration-300"
          [style.left.px]="targetRect()!.left"
          [style.top.px]="targetRect()!.top"
          [style.width.px]="targetRect()!.width"
          [style.height.px]="targetRect()!.height"
          class="rounded-xl border-2 border-brand bg-brand/10 outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
          [class.transparent-bg]="true"
        ></div>
      }

      @if (currentStep()) {
        <div
          class="fixed z-[62] pointer-events-auto w-full max-w-[420px] transition-all duration-300"
          [style.left.px]="tooltipX()"
          [style.top.px]="tooltipY()"
          [class.opacity-0]="!visible()"
          [class.opacity-100]="visible()"
          [class.translate-y-2]="!visible()"
          [class.translate-y-0]="visible()"
        >
          <div class="rounded-2xl border border-surface-line bg-surface-card p-4 shadow-float">
            <div class="flex items-start justify-between gap-3 mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-[15px] font-bold text-ink">{{ currentStep()!.title }}</h3>
                <p class="mt-1 text-[13px] text-ink-500 leading-relaxed">{{ currentStep()!.description }}</p>
              </div>
              <div class="shrink-0 grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand">
                <span class="text-[12px] font-bold">{{ currentIndex() + 1 }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div class="flex-1 h-1 bg-surface-line"></div>
              <div class="flex-1 h-1 bg-brand"></div>
            </div>

            <div class="mt-4 flex items-center justify-end gap-2">
              @if (currentIndex() > 0) {
                <app-button
                  variant="ghost"
                  size="sm"
                  icon="chevron-left"
                  label="Anterior"
                  [iconOnlyBelow]="null"
                  (click)="prev()"
                ></app-button>
              }
              <app-button
                variant="secondary"
                size="sm"
                icon="x"
                label="Saltar tutorial"
                [iconOnly]="true"
                buttonClass="h-9 w-9"
                (click)="skip()"
              ></app-button>
              @if (currentIndex() < stepCount - 1) {
                <app-button
                  variant="primary"
                  size="sm"
                  icon="chevron-right"
                  label="Seguinte"
                  [iconOnlyBelow]="null"
                  (click)="next()"
                ></app-button>
              } @else {
                <app-button
                  variant="primary"
                  size="sm"
                  icon="circle-check"
                  label="Concluir"
                  [iconOnlyBelow]="null"
                  (click)="finish()"
                ></app-button>
              }
            </div>
          </div>
        </div>
      }
    }
  `,
  host: {
    'class': 'block',
  },
})
export class OnboardingComponent implements AfterViewInit {
  private onboarding = inject(OnboardingService);

  readonly open = this.onboarding.open;
  readonly currentStep = this.onboarding.current;
  readonly currentIndex = this.onboarding.currentStep;
  readonly stepCount = this.onboarding.stepCount;

  readonly targetRect = signal<Rect | null>(null);
  readonly visible = signal(false);
  readonly reducedMotion = signal(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  constructor() {
    effect(() => {
      const step = this.currentStep();
      if (step && this.open()) {
        this.measureTarget(step.target);
        // Small delay to let layout settle before showing tooltip
        setTimeout(() => this.visible.set(true), 50);
      } else {
        this.targetRect.set(null);
        this.visible.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    const step = this.currentStep();
    if (step && this.open()) {
      this.measureTarget(step.target);
      setTimeout(() => this.visible.set(true), 50);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const step = this.currentStep();
    if (step) {
      this.measureTarget(step.target);
    }
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (this.open() && this.currentIndex() < this.stepCount - 1) this.next();
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (this.open() && this.currentIndex() > 0) this.prev();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.skip();
  }

  private measureTarget(selector: string): void {
    const el = document.querySelector(selector);
    if (!el) {
      this.targetRect.set(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    this.targetRect.set({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
  }

  tooltipX(): number {
    const rect = this.targetRect();
    if (!rect) return 16;
    const viewportWidth = window.innerWidth;
    const tooltipWidth = 420;
    const gap = 14;
    const pad = 16;

    let x: number;
    switch (this.currentStep()!.placement) {
      case 'left':
        x = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        x = rect.right + gap;
        break;
      case 'top':
      case 'bottom':
      default:
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
    }

    return Math.max(pad, Math.min(x, viewportWidth - tooltipWidth - pad));
  }

  tooltipY(): number {
    const rect = this.targetRect();
    if (!rect) return 16;
    const viewportHeight = window.innerHeight;
    const tooltipHeight = 210;
    const gap = 14;
    const pad = 16;

    let y: number;
    switch (this.currentStep()!.placement) {
      case 'top':
        y = rect.top - tooltipHeight - gap;
        break;
      case 'bottom':
        y = rect.bottom + gap;
        break;
      case 'left':
      case 'right':
      default:
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
        break;
    }

    return Math.max(pad, Math.min(y, viewportHeight - tooltipHeight - pad));
  }

  next(): void {
    this.visible.set(false);
    setTimeout(() => this.onboarding.next(), 300);
  }

  prev(): void {
    this.visible.set(false);
    setTimeout(() => this.onboarding.prev(), 300);
  }

  skip(): void {
    this.visible.set(false);
    this.onboarding.skip();
  }

  finish(): void {
    this.visible.set(false);
    this.onboarding.finish();
  }

  onBackdropClick(): void {
    this.skip();
  }
}
