import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataStore } from '../../core/data.store';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (store.flash(); as flash) {
      <div
        class="pointer-events-auto fixed bottom-6 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-start gap-3 rounded-2xl px-4 py-3 shadow-float"
        [class]="flash.kind === 'error' ? 'bg-danger-soft text-danger' : flash.kind === 'success' ? 'bg-success-soft text-success' : 'bg-brand-100 text-brand-fg'"
        role="status"
        aria-live="polite"
      >
        <span class="min-w-0 flex-1 text-[13px] font-semibold">{{ flash.text }}</span>
        <button type="button" class="shrink-0 text-[11px] font-bold uppercase tracking-wide opacity-70 hover:opacity-100" (click)="store.dismissFlash(flash.id)">Fechar</button>
      </div>
    }
  `,
})
export class ToastComponent {
  readonly store = inject(DataStore);

  constructor() {
    effect((onCleanup) => {
      const flash = this.store.flash();
      if (!flash) return;
      const timer = setTimeout(() => this.store.dismissFlash(flash.id), 5000);
      onCleanup(() => clearTimeout(timer));
    });
  }
}
