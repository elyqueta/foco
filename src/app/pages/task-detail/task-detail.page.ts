import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PostponeModalComponent } from '../../shared/ui/postpone-modal.component';
import { LucideAngularModule } from 'lucide-angular';
import { formatDate } from '../../core/date.utils';
import { Task, ActivityEntry, Project } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, PostponeModalComponent, LucideAngularModule],
  templateUrl: './task-detail.page.html',
})
export class TaskDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(DataStore);
  task = signal<Task | null>(null);
  showPostponeModal = signal(false);

  formatDate = formatDate;

  projects(): Project[] {
    return this.store.data().projects;
  }

  projectName(projectId: string | null): string {
    if (!projectId) return '';
    const p = this.store.data().projects.find((x) => x.id === projectId);
    return p ? p.name : '';
  }

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
    const map: Record<string, string> = { todo: 'A fazer', in_progress: 'Em curso', postponed: 'Adiada', done: 'Concluída', expired: 'Expirada' };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      todo: 'rounded-full bg-surface-line px-2.5 py-1 text-[10px] font-bold text-ink-500',
      in_progress: 'rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-fg',
      done: 'rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success',
      postponed: 'rounded-full bg-warn-soft px-2.5 py-1 text-[10px] font-bold text-warn',
      expired: 'rounded-full bg-danger-soft px-2.5 py-1 text-[10px] font-bold text-danger',
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

  async deleteTask(): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.deleteTask(id);
    this.router.navigate(['/tarefas']);
  }

  addNote(text: string): void {
    const id = this.task()?.id;
    if (!id || !text.trim()) return;
    this.store.addNote('task', id, text.trim());
  }

  postpone(): void {
    this.showPostponeModal.set(true);
  }

  onPostponeConfirm(date: string): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.postponeTask(id, date);
    this.showPostponeModal.set(false);
  }

  onPostponeCancel(): void {
    this.showPostponeModal.set(false);
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
      expired: 'Expirada',
    };
    return map[type] ?? type;
  }

  format(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }
}