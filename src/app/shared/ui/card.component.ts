import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div class="rounded-card bg-white p-5 shadow-card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-[16px] font-bold text-ink">{{ title() }}</h3>
        @if (actionLabel()) {
          <button class="text-[12px] text-ink-400 hover:text-brand transition" (click)="actionClick.emit()">{{ actionLabel() }}</button>
        }
      </div>
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  title = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}
