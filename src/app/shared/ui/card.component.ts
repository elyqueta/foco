import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
})
export class CardComponent {
  title = input.required<string>();
  actionLabel = input<string | null>(null);
  actionClick = output<void>();
}
