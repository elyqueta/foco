import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  host: {
    class: 'block min-w-0',
  },
})
export class CardComponent {
  title = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}
