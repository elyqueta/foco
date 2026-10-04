import { Component, input } from '@angular/core';
import { Category } from '../../core/models';

@Component({
  selector: 'app-badge-category',
  standalone: true,
  template: `
    <span class="rounded-md px-2 py-1 text-[10px] font-semibold text-white" [class.bg-brand]="category() === 'professional'" [class.bg-teal-tag]="category() === 'personal'" [class.bg-[#F5A524]]="category() === 'household'">
      {{ label() }}
    </span>
  `,
})
export class BadgeCategoryComponent {
  category = input.required<Category>();

  label(): string {
    const map: Record<Category, string> = { professional: 'Profissional', personal: 'Pessoal', household: 'Doméstica' };
    return map[this.category()];
  }
}
