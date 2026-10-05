import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AppIconComponent } from './icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'md' | 'sm';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [attr.aria-label]="label()"
      [attr.title]="label()"
      [attr.aria-expanded]="ariaExpanded()"
      [class]="buttonClasses()"
    >
      @if (loading()) {
        <app-icon name="loader-circle" [size]="iconSize()" class="animate-spin" />
      } @else {
        <app-icon [name]="icon()" [size]="iconSize()" />
      }
      <span [class]="labelClasses()">{{ text() ?? label() }}</span>
    </button>
  `,
})
export class AppButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  icon = input.required<string>();
  label = input.required<string>();
  text = input<string | null>(null);
  ariaExpanded = input<boolean | null>(null);
  iconOnlyBelow = input<'sm' | 'md' | null>('sm');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input(false);
  loading = input(false);
  buttonClass = input('');
  iconOnly = input(false);

  readonly iconSize = computed(() => (this.size() === 'sm' ? 16 : 18));

  readonly labelClasses = computed(() => {
    if (this.iconOnly()) return 'sr-only';
    const breakpoint = this.iconOnlyBelow();
    if (breakpoint === 'sm') return 'hidden sm:inline';
    if (breakpoint === 'md') return 'hidden md:inline';
    return 'inline';
  });

  readonly buttonClasses = computed(() => {
    const size = this.size();
    const responsiveSize = {
      sm: {
        md: 'h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-3',
        mdAt: 'h-9 w-9 p-0 md:h-9 md:w-auto md:px-3',
        full: 'h-9 px-3',
      },
      md: {
        md: 'h-10 w-10 p-0 sm:h-10 sm:w-auto sm:px-4',
        mdAt: 'h-10 w-10 p-0 md:h-10 md:w-auto md:px-4',
        full: 'h-10 px-4',
      },
    }[size];
    const variant: Record<ButtonVariant, string> = {
      primary: 'bg-brand text-primary-fg hover:bg-brand-600',
      secondary: 'border border-surface-line bg-surface-app text-ink hover:bg-brand-50',
      ghost: 'bg-transparent text-ink-500 hover:bg-surface-app hover:text-ink',
      danger: 'border border-danger/40 bg-transparent text-danger hover:bg-danger-soft',
      dark: 'bg-strong text-white hover:opacity-90',
    };
    const textSize = size === 'sm' ? 'text-xs' : 'text-[13px]';
    return [
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150',
      'active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:cursor-not-allowed disabled:opacity-50',
      this.iconOnly()
        ? (size === 'sm' ? 'h-9 w-9 p-0' : 'h-10 w-10 p-0')
        : this.iconOnlyBelow() === 'sm'
        ? responsiveSize.md
        : this.iconOnlyBelow() === 'md'
          ? responsiveSize.mdAt
          : responsiveSize.full,
      textSize,
      variant[this.variant()],
      this.buttonClass(),
    ].join(' ');
  });
}
