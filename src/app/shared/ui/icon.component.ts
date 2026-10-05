import { ChangeDetectionStrategy, Component, input, isDevMode, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { APP_ICON_NAMES } from '../../core/icons';

const registeredIcons = new Set<string>(APP_ICON_NAMES);
const warnedIcons = new Set<string>();

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0',
    '[attr.aria-hidden]': 'true',
  },
  template: `
    <lucide-icon
      [name]="name()"
      [size]="size()"
      [strokeWidth]="strokeWidth()"
      [class]="className()"
    />
  `,
})
export class AppIconComponent implements OnInit {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(1.75);
  className = input<string>('', { alias: 'class' });

  ngOnInit(): void {
    const icon = this.name();
    if (isDevMode() && !registeredIcons.has(icon) && !warnedIcons.has(icon)) {
      warnedIcons.add(icon);
      console.warn(`[Foco] Ícone Lucide não registado: "${icon}".`);
    }
  }
}
