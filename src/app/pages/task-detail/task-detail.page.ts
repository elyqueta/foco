import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { FocusService } from '../../core/focus.service';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { PostponeModalComponent } from '../../shared/ui/postpone-modal.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { formatDate } from '../../core/date.utils';
import { activityLabel } from '../../core/activity.utils';
import { Task, ActivityEntry, Project } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, PostponeModalComponent, AppIconComponent, AppButtonComponent, SkeletonComponent],
  templateUrl: './task-detail.page.html',
})
export class TaskDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly store = inject(DataStore);
  private focus = inject(FocusService);
  showPostponeModal = signal(false);
  detailLoading = signal(false);
  /** Paginação horizontal da timeline de atividade. */
  readonly activityPage = signal(0);
  private readonly activityPageSize = 5;

  private readonly taskId = signal<string | null>(null);

  /** Derivado da store: notas e edições refletem-se sem recarregar a página. */
  task = computed(() => {
    const id = this.taskId();
    if (!id) return null;
    return this.store.data().tasks.find((t) => t.id === id) ?? null;
  });

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
      this.taskId.set(id);
      this.activityPage.set(0);
      if (!id) return;
      if (this.store.useApi) {
        this.detailLoading.set(true);
        void this.store.fetchTaskDetail(id).then(() => {
          if (this.taskId() === id) this.detailLoading.set(false);
        });
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

  async updateField(field: string, value: unknown): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.updateTask(id, { [field]: value } as Partial<Task>);
  }

  async setCanPostpone(value: boolean): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.updateTask(id, { canPostpone: value });
  }

  async completeTask(): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.setTaskStatus(id, 'done');
  }

  async reopenTask(): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.setTaskStatus(id, 'todo');
  }

  async startFocus(): Promise<void> {
    const task = this.task();
    if (!task || task.status === 'done') return;
    if (this.store.useApi) {
      await this.store.startTaskTimer(task.id);
      return;
    }
    if (task.status !== 'in_progress') {
      await this.store.setTaskStatus(task.id, 'in_progress');
    }
    this.focus.start(task);
  }

  /** Estado do timer desta tarefa (modo API). */
  timerState(): 'idle' | 'running' | 'paused' | 'stopped' | null {
    return this.task()?.timer?.state ?? null;
  }

  /** Segundos acumulados a mostrar (do timer ativo quando é esta a tarefa). */
  trackedSeconds(): number {
    const task = this.task();
    if (!task) return 0;
    if (this.store.activeTimerTask()?.id === task.id) return this.store.activeTimerSeconds();
    return task.timer?.trackedSeconds ?? 0;
  }

  /** Começa, pausa ou retoma o temporizador desta tarefa. */
  async toggleTimer(): Promise<void> {
    const task = this.task();
    if (!task || task.status === 'done') return;
    if (!this.store.useApi) {
      await this.startFocus();
      return;
    }
    const state = task.timer?.state;
    if (state === 'running') {
      await this.store.pauseTaskTimer(task.id);
    } else if (state === 'paused') {
      await this.store.resumeTaskTimer(task.id);
    } else {
      await this.store.startTaskTimer(task.id);
    }
  }

  async deleteTask(): Promise<void> {
    const id = this.task()?.id;
    if (!id) return;
    await this.store.deleteTask(id);
    this.router.navigate(['/tarefas']);
  }

  async addNote(text: string): Promise<void> {
    const id = this.task()?.id;
    if (!id || !text.trim()) return;
    const ok = await this.store.addNote('task', id, text.trim());
    // A nota nova é a entrada mais recente: volta à primeira página.
    if (ok) this.activityPage.set(0);
  }

  postpone(): void {
    this.showPostponeModal.set(true);
  }

  async onPostponeConfirm(date: string): Promise<void> {
    const id = this.task()?.id;
    this.showPostponeModal.set(false);
    if (!id) return;
    await this.store.postponeTask(id, date);
  }

  onPostponeCancel(): void {
    this.showPostponeModal.set(false);
  }

  sortedActivity(): ActivityEntry[] {
    const activity = this.task()?.activity ?? [];
    return [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  /** Entradas da página atual (mais recentes primeiro). */
  pagedActivity(): ActivityEntry[] {
    const all = this.sortedActivity();
    const start = this.activityPage() * this.activityPageSize;
    return all.slice(start, start + this.activityPageSize);
  }

  activityPageCount(): number {
    return Math.max(1, Math.ceil(this.sortedActivity().length / this.activityPageSize));
  }

  activityPages(): number[] {
    return Array.from({ length: this.activityPageCount() }, (_, index) => index);
  }

  goToActivityPage(page: number): void {
    this.activityPage.set(Math.min(Math.max(page, 0), this.activityPageCount() - 1));
  }

  labelOf = activityLabel;

  format(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }

  formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  }
}