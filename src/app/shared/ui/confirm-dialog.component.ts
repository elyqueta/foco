import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from './icon.component';
import { AppButtonComponent } from './button.component';

type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AppButtonComponent],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" (click)="onOverlayClick()">
      <div class="w-full max-w-[400px] rounded-card bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <div class="flex flex-col items-center text-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-full" [class]="iconBg()">
            <app-icon [name]="iconName()" [class]="iconColor()" />
          </div>

          <h2 class="text-[18px] font-bold text-ink">{{ title() }}</h2>
          <p class="text-[13px] text-ink-500">{{ message() }}</p>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <app-button variant="secondary" icon="x" [label]="cancelLabel()" [iconOnlyBelow]="null" (click)="cancel.emit()"></app-button>
          <app-button [variant]="type() === 'danger' ? 'danger' : 'primary'" [icon]="iconName()" [label]="confirmLabel()" [iconOnlyBelow]="null" (click)="confirm.emit()"></app-button>
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
      info: 'info',
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

  onOverlayClick(): void {
    this.cancel.emit();
  }
}