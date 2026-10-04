import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  template: `
    <div class="flex items-center justify-center py-20">
      <app-empty-state title="Em breve" message="As definições estarão disponíveis em breve." />
    </div>
  `,
})
export class SettingsPage {}
