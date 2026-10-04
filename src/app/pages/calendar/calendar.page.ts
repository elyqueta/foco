import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="flex items-center justify-center py-20">
      <app-empty-state title="Em breve" message="O calendário estará disponível em breve." />
    </div>
  `,
})
export class CalendarPage {}
