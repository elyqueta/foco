import { Component, input } from '@angular/core';
import { Category } from '../../core/models';
import { categoryLabel } from '../../core/category.utils';

@Component({
  selector: 'app-badge-category',
  standalone: true,
  templateUrl: './badge-category.component.html',
})
export class BadgeCategoryComponent {
  category = input.required<Category>();

  label(): string {
    return categoryLabel(this.category());
  }

  categoryClass(): string {
    const map: Record<string, string> = {
      professional: 'bg-brand',
      personal: 'bg-teal-tag',
      household: 'bg-warn',
    };
    return map[this.category()] ?? 'bg-ink-500';
  }
}