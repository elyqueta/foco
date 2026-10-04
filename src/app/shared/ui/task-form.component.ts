import { Component, EventEmitter, Input, Output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, Category, Urgency, Status, Project } from '../../core/models';
import { BadgeUrgencyComponent } from './badge-urgency.component';
import { BadgeCategoryComponent } from './badge-category.component';
import { DataStore } from '../../core/data.store';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-form.component.html',
})
export class TaskFormComponent {
  private store = inject(DataStore);
  @Input() task?: Task;
  @Input() initialDueDate: string | null = null;
  @Output() submit = new EventEmitter<Partial<Task>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<Partial<Task>>({});
  touched = signal(false);

  projects(): Project[] {
    return this.store.data().projects;
  }

  dueDateTime(): string {
    const due = this.form().dueDate;
    if (!due) return '';
    const d = new Date(due);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onDueDateTime(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update((f) => ({ ...f, dueDate: input.value || null }));
  }

  constructor() {
    effect(() => {
      if (this.initialDueDate) {
        this.form.update((f) => ({ ...f, dueDate: this.initialDueDate }));
      }
    });
  }
}