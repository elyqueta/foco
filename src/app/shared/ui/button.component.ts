import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { NgIf } from '@angular/common';
import { AppIconComponent } from './icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
export type ButtonSize = 'md' | 'sm';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgIf, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.inline-flex]': 'true',
    '[class.items-center]': 'true',
    '[class.justify-center]': 'true',
    '[class.gap-2]': 'true',
    '[class.rounded-xl]': 'true',
    '[class.font-semibold]': 'true',
    '[class.transition-all]': 'true',
    '[class.duration-150]': 'true',
    '[class.outline-none]': 'true',
    '[class.h-10]': 'size() === "md"',
    '[class.h-9]': 'size() === "sm"',
    '[class.px-4]': 'size() === "md" && shouldShowLabel()',
    '[class.px-3]': 'size() === "sm" && shouldShowLabel()',
    '[class.w-10]': '!shouldShowLabel()',
    '[class.p-0]': '!shouldShowLabel()',
    '[class.text-sm]': 'size() === "md"',
    '[class.text-xs]': 'size() === "sm"',
    '[class.active:scale-[.98]]': '!disabled()',
    '[class.focus-visible:ring-2]': 'true',
    '[class.focus-visible:ring-brand/40]': 'true',
    '[class.focus-visible:ring-offset-2]': 'true',
    '[class.focus-visible:ring-offset-surface-card]': 'true',
    '[class.disabled:opacity-50]': 'disabled()',
    '[class.disabled:cursor-not-allowed]': 'disabled()',
    '[class.cursor-pointer]': '!disabled()',
    '[class.bg-brand]': 'variant() === "primary"',
    '[class.text-white]': 'variant() === "primary" || variant() === "dark"',
    '[class.hover:bg-brand-600]': 'variant() === "primary"',
    '[class.bg-strong]': 'variant() === "dark"',
    '[class.bg-surface-app]': 'variant() === "secondary" || variant() === "ghost"',
    '[class.border]': 'variant() === "secondary" || variant() === "danger"',
    '[class.border-surface-line]': 'variant() === "secondary"',
    '[class.text-ink]': 'variant() === "secondary"',
    '[class.text-ink-500]': 'variant() === "ghost"',
    '[class.hover:bg-surface-app]': 'variant() === "ghost"',
    '[class.text-danger]': 'variant() === "danger"',
    '[class.border-danger/40]': 'variant() === "danger"',
    '[class.hover:bg-danger-soft]': 'variant() === "danger"',
  },
  template: `
    <app-icon *ngIf="!loading()" [name]="icon()" [size]="iconSize()" [class]="iconClass()" />
    <app-icon *ngIf="loading()" name="loader-circle" [size]="iconSize()" [class]="iconClass()" class="animate-spin" />
    <span *ngIf="shouldShowLabel()" class="hidden sm:inline">{{ label() }}</span>
  `,
})
export class AppButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  icon = input.required<string>();
  label = input.required<string>();
  iconOnlyBelow = input<'sm' | 'md' | null>(null);
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);

  shouldShowLabel = computed(() => {
    const below = this.iconOnlyBelow();
    if (below === null) return true;
    return below === 'md'; // 'md' means show label on md+, hide on sm; 'sm' means show on sm+, hide below
  });

  iconSize = computed(() => (this.size() === 'sm' ? 16 : 18));

  iconClass = computed(() => {
    const v = this.variant();
    if (v === 'primary' || v === 'dark') return 'text-white';
    if (v === 'danger') return 'text-danger';
    if (v === 'ghost') return 'text-ink-500';
    return 'text-brand';
  });
}
