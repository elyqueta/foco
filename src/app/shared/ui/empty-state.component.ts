import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  title = input.required<string>();
  message = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}
