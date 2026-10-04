import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, Category, Urgency, Status } from '../../core/models';
import { BadgeUrgencyComponent } from './badge-urgency.component';
import { BadgeCategoryComponent } from './badge-category.component';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
})
export class TaskFormComponent {
  @Input() task?: Task;
  @Output() submit = new EventEmitter<Partial<Task>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<Partial<Task>>({});
}
