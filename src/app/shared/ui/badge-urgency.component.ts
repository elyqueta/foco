import { Component, input } from '@angular/core';
import { Urgency } from '../../core/models';

@Component({
  selector: 'app-badge-urgency',
  standalone: true,
  template: `
    <span class="rounded-full px-2.5 py-1 text-[10px] font-bold" [class.bg-danger-soft]="urgency() === 'critical'" [class.text-danger]="urgency() === 'critical'" [class.bg-warn-soft]="urgency() === 'high'" [class.text-warn]="urgency() === 'high'" [class.bg-brand-100]="urgency() === 'medium'" [class.text-brand]="urgency() === 'medium'" [class.bg-success-soft]="urgency() === 'low'" [class.text-success]="urgency() === 'low'">
      {{ label() }}
    </span>
    @if (canPostpone()) {
      <span class="text-[10px] text-ink-400 ml-1 inline-flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Pode adiar
      </span>
    }
  `,
})
export class BadgeUrgencyComponent {
  urgency = input.required<Urgency>();
  canPostpone = input(false);

  label(): string {
    const map: Record<Urgency, string> = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
    return map[this.urgency()];
  }
}
