import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
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
    @for (option of options; track option.value) {
      <button
        #radioOption
        type="button"
        role="radio"
        [attr.aria-checked]="theme() === option.value"
        [class]="theme() === option.value
          ? 'inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink shadow-sm ring-1 ring-surface-line transition-colors duration-150 bg-surface-card'
          : 'inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink-500 transition-colors duration-150 hover:text-ink'"
        (click)="select(option.value)"
      >
        <app-icon [name]="option.icon" [size]="14" [class]="theme() === option.value ? 'text-brand-fg' : ''" />
        <span class="hidden md:inline">{{ option.label }}</span>
      </button>
    }
  `,
})
export class AppThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  readonly theme = this.themeService.theme;
  readonly options = [
    { value: 'light' as const, label: 'Claro', icon: 'sun' },
    { value: 'dark' as const, label: 'Escuro', icon: 'moon' },
  ];

  select(value: 'light' | 'dark'): void {
    this.themeService.set(value);
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.select(nextTheme);
    const currentTarget = event.currentTarget;
    if (currentTarget instanceof HTMLElement) {
      const nextIndex = this.options.findIndex((option) => option.value === nextTheme);
      currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex]?.focus();
    }
  }
}
