import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { LucideAngularModule } from 'lucide-angular';
import { formatDate } from '../../core/date.utils';
import { Task, ActivityEntry } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, LucideAngularModule],
  templateUrl: './task-detail.page.html',
})
export class TaskDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
  task = signal<Task | null>(null);

  formatDate = formatDate;

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
    const map: Record<string, string> = { todo: 'A fazer', in_progress: 'Em curso', postponed: 'Adiada', done: 'Concluída' };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      todo: 'rounded-full bg-surface-line px-2.5 py-1 text-[10px] font-bold text-ink-500',
      in_progress: 'rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-fg',
      done: 'rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success',
      postponed: 'rounded-full bg-warn-soft px-2.5 py-1 text-[10px] font-bold text-warn',
    };
    return map[status] ?? 'rounded-full bg-surface-line px-2.5 py-1 text-[10px] font-bold text-ink-500';
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

  setCanPostpone(value: boolean): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.updateTask(id, { canPostpone: value });
  }

  completeTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.setTaskStatus(id, 'done');
  }

  reopenTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.setTaskStatus(id, 'todo');
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

  sortedActivity(): ActivityEntry[] {
    const activity = this.task()?.activity ?? [];
    return [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  labelOf(type: ActivityEntry['type']): string {
    const map: Record<ActivityEntry['type'], string> = {
      created: 'Criado',
      status_changed: 'Estado alterado',
      note: 'Nota',
      postponed: 'Adiado',
      edited: 'Editado',
      next_step_changed: 'Próximo passo atualizado',
    };
    return map[type] ?? type;
  }

  format(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }
}