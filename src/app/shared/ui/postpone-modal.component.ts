import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataStore } from '../../core/data.store';
import { toISODateTime } from '../../core/date.utils';

@Component({
  selector: 'app-postpone-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" (click)="onOverlayClick()">
      <div class="w-full max-w-[400px] rounded-card bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <h2 class="text-[18px] font-bold text-ink mb-1">Adiar tarefa</h2>
        <p class="text-[13px] text-ink-500 mb-4">Escolhe uma nova data e hora para esta tarefa.</p>

        <div class="mb-4">
          <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Nova data e hora</label>
          <input type="datetime-local" [value]="dateTime()" (input)="onDateTimeChange($event)" class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </div>

        <div class="flex items-center justify-end gap-3">
          <button type="button" (click)="cancel.emit()" class="h-10 rounded-xl border border-surface-line bg-surface-card px-5 text-[13px] font-semibold text-ink-500 transition hover:text-ink">Cancelar</button>
          <button type="button" (click)="confirm.emit(dateTime())" [disabled]="!isValid()" class="h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">Adiar</button>
        </div>
      </div>
    </div>
  `,
})
export class PostponeModalComponent {
  dateTime = signal(toISODateTime(new Date()));
  taskId = input<string | null>(null);

  confirm = output<string>();
  cancel = output<void>();

  onDateTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.dateTime.set(input.value);
  }

  isValid(): boolean {
    return !!this.dateTime() && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(this.dateTime());
  }

  onOverlayClick(): void {
    this.cancel.emit();
  }
}