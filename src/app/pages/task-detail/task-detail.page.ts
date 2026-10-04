import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { formatDate } from '../../core/date.utils';
import { Task } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent],
  templateUrl: './task-detail.page.html',
})
export class TaskDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
  task = signal<Task | null>(null);

  formatDate = formatDate;
  formatDateTime = formatDate;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const t = this.store.data().tasks.find((x) => x.id === id);
        this.task.set(t ?? null);
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { todo: 'Por fazer', in_progress: 'Em curso', postponed: 'Adiada', done: 'Concluída' };
    return map[status] ?? status;
  }

  toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  updateField(field: string, value: unknown): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.updateTask(id, { [field]: value } as Partial<Task>);
  }

  completeTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.setTaskStatus(id, 'done');
  }

  deleteTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.deleteTask(id);
  }

  addNote(text: string): void {
    const id = this.task()?.id;
    if (!id || !text.trim()) return;
    this.store.addNote('task', id, text.trim());
  }

  postpone(): void {
    const id = this.task()?.id;
    if (!id) return;
    const newDate = prompt('Nova data (YYYY-MM-DD):');
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      this.store.postponeTask(id, newDate);
    }
  }
}
