import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, AppIconComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
         <app-icon [name]="icon()" [size]="24" />
      </div>
      <h3 class="text-base font-semibold text-ink mb-1">{{ title() }}</h3>
      <p class="text-sm text-ink-500 mb-4 max-w-[280px]">{{ message() }}</p>
      @if (actionLabel()) {
        <button (click)="actionClick.emit()" class="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark transition">{{ actionLabel() }}</button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  icon = input<string>('check-circle');
  title = input.required<string>();
  message = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}