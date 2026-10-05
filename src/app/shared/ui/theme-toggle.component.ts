import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { ThemeService } from '../../core/theme.service';
import { AppIconComponent } from './icon.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex h-10 items-center rounded-xl border border-surface-line bg-surface-app p-1',
    role: 'radiogroup',
    '[attr.aria-label]': '"Tema"',
  },
  template: `
    @for (opt of options; track opt.value) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="theme() === opt.value"
        [class]="theme() === opt.value ? 'bg-surface-card text-ink shadow-sm ring-1 ring-surface-line' : 'text-ink-500 hover:text-ink'"
        (click)="select(opt.value)"
        class="h-8 min-w-8 rounded-lg px-2.5 gap-1.5 inline-flex items-center justify-center text-xs font-semibold transition-colors duration-150"
      >
        <app-icon [name]="opt.icon" [size]="14" [class]="theme() === opt.value ? 'text-brand-fg' : ''" />
        <span class="hidden md:inline">{{ opt.label }}</span>
      </button>
    }
  `,
})
export class AppThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  theme = this.themeService.theme;
  select = (value: 'light' | 'dark') => this.themeService.set(value);

  options = [
    { value: 'light' as const, label: 'Claro', icon: 'sun' },
    { value: 'dark' as const, label: 'Escuro', icon: 'moon' },
  ];
}
