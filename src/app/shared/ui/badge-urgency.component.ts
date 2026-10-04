import { Component, input } from '@angular/core';
import { Urgency } from '../../core/models';

@Component({
  selector: 'app-badge-urgency',
  standalone: true,
  templateUrl: './badge-urgency.component.html',
})
export class BadgeUrgencyComponent {
  urgency = input.required<Urgency>();
  canPostpone = input(false);

  label(): string {
    const map: Record<Urgency, string> = { critical: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa' };
    return map[this.urgency()];
  }

  urgencyClass(): string {
    const map: Record<Urgency, string> = {
      critical: 'bg-danger-soft text-danger',
      high: 'bg-warn-soft text-warn',
      medium: 'bg-brand-100 text-brand-fg',
      low: 'bg-success-soft text-success',
    };
    return map[this.urgency()];
  }
}