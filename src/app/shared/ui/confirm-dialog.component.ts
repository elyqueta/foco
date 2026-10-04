import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" (click)="onOverlayClick()">
      <div class="w-full max-w-[400px] rounded-card bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <div class="flex flex-col items-center text-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-full" [class]="iconBg()">
            <lucide-icon [name]="iconName()" class="h-6 w-6" [strokeWidth]="2" [class]="iconColor()" />
          </div>

          <h2 class="text-[18px] font-bold text-ink">{{ title() }}</h2>
          <p class="text-[13px] text-ink-500">{{ message() }}</p>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <button type="button" (click)="cancel.emit()"
            class="h-10 rounded-xl border border-surface-line bg-surface-card px-5 text-[13px] font-semibold text-ink-500 transition hover:text-ink">
            {{ cancelLabel() }}
          </button>
          <button type="button" (click)="confirm.emit()"
            class="h-10 rounded-xl px-5 text-[13px] font-semibold text-white transition"
            [class]="confirmButtonClass()">
            {{ confirmLabel() }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  title = input.required<string>();
  message = input.required<string>();
  type = input<ConfirmType>('info');
  confirmLabel = input<string>('Confirmar');
  cancelLabel = input<string>('Cancelar');

  confirm = output<void>();
  cancel = output<void>();

  iconName(): string {
    const map: Record<ConfirmType, string> = {
      danger: 'trash-2',
      warning: 'triangle-alert',
      info: 'circle-alert',
      success: 'circle-check',
    };
    return map[this.type()];
  }

  iconColor(): string {
    const map: Record<ConfirmType, string> = {
      danger: 'text-danger',
      warning: 'text-warn',
      info: 'text-brand',
      success: 'text-success',
    };
    return map[this.type()];
  }

  iconBg(): string {
    const map: Record<ConfirmType, string> = {
      danger: 'bg-danger-soft',
      warning: 'bg-warn-soft',
      info: 'bg-brand-100',
      success: 'bg-success-soft',
    };
    return map[this.type()];
  }

  confirmButtonClass(): string {
    const map: Record<ConfirmType, string> = {
      danger: 'bg-danger hover:bg-danger/90',
      warning: 'bg-warn hover:bg-warn/90',
      info: 'bg-brand hover:bg-brand-600',
      success: 'bg-success hover:bg-success/90',
    };
    return map[this.type()];
  }

  onOverlayClick(): void {
    this.cancel.emit();
  }
}