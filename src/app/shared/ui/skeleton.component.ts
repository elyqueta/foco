import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="animate-pulse rounded-lg bg-surface-line" [class]="hostClass()" aria-hidden="true"></div>`,
})
export class SkeletonComponent {
  /** Classes adicionais (dimensões, cantos, etc.) — o utilitário já é aplicado por defeito. */
  hostClass = input<string>('');
}
