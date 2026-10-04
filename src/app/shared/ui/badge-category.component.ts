import { Component, input } from '@angular/core';
import { Category } from '../../core/models';

@Component({
  selector: 'app-badge-category',
  standalone: true,
  templateUrl: './badge-category.component.html',
})
export class BadgeCategoryComponent {
  category = input.required<Category>();

  label(): string {
    const map: Record<Category, string> = { professional: 'Profissional', personal: 'Pessoal', household: 'Doméstica' };
    return map[this.category()];
  }

  categoryClass(): string {
    const map: Record<Category, string> = {
      professional: 'bg-brand text-white',
      personal: 'bg-teal-tag text-white',
      household: 'bg-warn text-white',
    };
    return map[this.category()];
  }
}