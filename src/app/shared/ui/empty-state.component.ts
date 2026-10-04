import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="h-14 w-14 rounded-2xl bg-brand-100 text-brand grid place-items-center mb-4">
        <lucide-icon [name]="icon()" class="h-6 w-6" [strokeWidth]="1.75" />
      </div>
      <h3 class="text-[15px] font-bold text-ink mb-1">{{ title() }}</h3>
      <p class="text-[12px] text-ink-500 mb-4 max-w-[280px]">{{ message() }}</p>
      @if (actionLabel()) {
        <button (click)="actionClick.emit()" class="h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-600 transition">{{ actionLabel() }}</button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input<string>('circle-check');
  title = input.required<string>();
  message = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}