import { Component, input, output } from '@angular/core';
import { Task } from '../../core/models';
import { BadgeUrgencyComponent } from './badge-urgency.component';
import { BadgeCategoryComponent } from './badge-category.component';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [BadgeUrgencyComponent, BadgeCategoryComponent],
  templateUrl: './task-row.component.html',
})
export class TaskRowComponent {
  task = input.required<Task>();
  projectName = input('');
  dueLabel = input('');
  click = output<string>();
  toggle = output<string>();
}
