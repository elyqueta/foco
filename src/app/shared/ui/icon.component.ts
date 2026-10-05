import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule, LucideComponent } from 'lucide-angular';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0', '[attr.aria-hidden]': 'true' },
  template: `<lucide-icon [name]="name()" [size]="size()" [strokeWidth]="strokeWidth()" [class]="class()" />`,
})
export class AppIconComponent {
  name = input.required<string>();
  size = input<number>(18);
  strokeWidth = input<number>(1.75);
  class = input<string>('');
}
