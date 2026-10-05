import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from './icon.component';
import { AppButtonComponent } from './button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AppButtonComponent],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-fg mb-4">
        <app-icon [name]="icon()" [size]="24" />
      </div>
      <h3 class="text-base font-semibold text-ink mb-1">{{ title() }}</h3>
      <p class="text-sm text-ink-500 mb-4 max-w-[280px]">{{ message() }}</p>
      @if (actionLabel()) {
        <app-button icon="plus" [label]="actionLabel() ?? ''" [iconOnlyBelow]="null" (click)="actionClick.emit()"></app-button>
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