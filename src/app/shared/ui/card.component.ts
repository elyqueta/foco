import { Component, input, output } from '@angular/core';
import { AppButtonComponent } from './button.component';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [AppButtonComponent],
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
