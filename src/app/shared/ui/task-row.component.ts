import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Task } from '../../core/models';
import { BadgeUrgencyComponent } from './badge-urgency.component';
import { BadgeCategoryComponent } from './badge-category.component';
import { DataStore } from '../../core/data.store';
import { formatDate } from '../../core/date.utils';
import { FocoIconComponent } from '../brand/foco-icon.component';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeUrgencyComponent, BadgeCategoryComponent, FocoIconComponent],
  templateUrl: './task-row.component.html',
})
export class TaskRowComponent {
  private store = inject(DataStore);
  task = input.required<Task>();
  projectName = input('');
  dueLabel = input('');
  click = output<string>();
  toggle = output<string>();

  taskMeta(): string[] {
    const t = this.task();
    const parts: string[] = [];
    if (t.projectId) {
      const p = this.store.data().projects.find((x) => x.id === t.projectId);
      if (p) parts.push(p.name);
    }
    if (t.dueDate) parts.push(formatDate(t.dueDate));
    if (t.estimateMinutes) parts.push(`${t.estimateMinutes} min`);
    return parts;
  }
}