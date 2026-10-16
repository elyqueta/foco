import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { TaskModalService } from '../../core/task-modal.service';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { TaskRowComponent } from '../../shared/ui/task-row.component';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { FocoLogoComponent } from '../../shared/brand/foco-logo.component';
import { AuthService } from '../../core/auth/auth.service';
import { FocusService } from '../../core/focus.service';
import { Task, ActivityEntry } from '../../core/models';
import { formatDate, todayISO, weekDaysMondayFirst, parseISODate, addDays, toISODate, toDatePart } from '../../core/date.utils';
import { categoryLabel } from '../../core/category.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, ProgressRingComponent, EmptyStateComponent, TaskRowComponent, AppIconComponent, AppButtonComponent, FocoLogoComponent, SkeletonComponent],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private store = inject(DataStore);
  private modal = inject(TaskModalService);
  private router = inject(Router);
  private auth = inject(AuthService);
  private focus = inject(FocusService);

  todayTasks = this.store.todayTasks;
  pendingTasks = this.store.pendingTasks;
  urgentTasks = this.store.urgentTasks;
  nextSteps = this.store.nextSteps;
  statsByCategory = this.store.statsByCategory;
  completedThisWeek = this.store.completedThisWeek;

  loading = this.store.loading;
  loadError = this.store.loadError;

  userName = computed(() => this.auth.user()?.name ?? this.store.data().settings.userName);

  selectedDate = signal(todayISO());
  weekStart = signal(todayISO());

  retry(): void {
    this.store.retryLoad();
  }

  focusTask(): Task | undefined {
    return this.urgentTasks()[0];
  }

  focusSessionTask(): Task | undefined {
    if (this.store.useApi) {
      return this.store.activeTimerTask() ?? undefined;
    }
    const session = this.focus.session();
    if (!session) return undefined;
    return this.store.data().tasks.find((t) => t.id === session.taskId) ?? undefined;
  }

  readonly focusTick = computed(() => (this.store.useApi ? this.store.activeTimerSeconds() : this.focus.tick()));
  readonly focusActive = computed(() => (this.store.useApi ? this.store.activeTimerTask() !== null : this.focus.active()));
  readonly focusPaused = computed(() => (this.store.useApi ? false : this.focus.paused()));

  /** A tarefa em destaque tem o timer iniciado e pausado (mostrar "Retomar"). */
  focusTaskTimerPaused(): boolean {
    const task = this.focusTask();
    return !!task && this.store.useApi && task.timer?.state === 'paused';
  }

  constructor() {
    this.focus.tick;
  }

  categories() {
    const stats = this.statsByCategory();
    return this.store.categories().map((key) => ({
      key,
      label: categoryLabel(key),
      value: stats[key] ?? { total: 0, done: 0, percent: 0 },
    }));
  }

  projectName(projectId: string | null): string {
    if (!projectId) return 'Sem projeto';
    const p = this.store.data().projects.find((x) => x.id === projectId);
    return p ? p.name : 'Sem projeto';
  }

  dueLabel(task: Task): string {
    if (task.dueDate) return formatDate(task.dueDate);
    return 'Sem prazo';
  }

  async toggleTask(id: string): Promise<void> {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = task.status === 'done' ? 'todo' : 'done';
    await this.store.setTaskStatus(id, next);
  }

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  go(kind: 'task' | 'project', id: string): void {
    const path = kind === 'task' ? `/tarefas/${id}` : `/projetos/${id}`;
    this.router.navigate([path]);
  }

  openModal(): void {
    this.modal.show();
  }

  async startFocus(id: string): Promise<void> {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    if (this.store.useApi) {
      await this.store.startTaskTimer(id);
      return;
    }
    await this.store.setTaskStatus(id, 'in_progress');
    this.focus.start(task);
  }

  async resumeFocusTask(id: string): Promise<void> {
    if (this.store.useApi) {
      await this.store.resumeTaskTimer(id);
      return;
    }
    this.focus.resume();
  }

  async pauseFocus(): Promise<void> {
    if (this.store.useApi) {
      const task = this.store.activeTimerTask();
      if (task) await this.store.pauseTaskTimer(task.id);
      return;
    }
    this.focus.pause();
  }

  async resumeFocus(): Promise<void> {
    const task = this.focusSessionTask();
    if (!task) return;
    if (this.store.useApi) {
      await this.store.resumeTaskTimer(task.id);
      return;
    }
    this.focus.resume();
  }

  async stopFocus(): Promise<void> {
    if (this.store.useApi) {
      const task = this.store.activeTimerTask();
      if (task) await this.store.pauseTaskTimer(task.id);
      return;
    }
    this.focus.stop();
  }

  viewFocusTask(): void {
    const task = this.focusSessionTask();
    if (task) {
      this.router.navigate(['/tarefas', task.id]);
    }
  }

  weekDays(): string[] {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  }

  weekDates() {
    const base = parseISODate(this.weekStart());
    const days = weekDaysMondayFirst(base);
    return days.map((d) => {
      const full = toISODate(d);
      const inMonth = d.getMonth() === base.getMonth();
      return { num: d.getDate(), full, inMonth };
    });
  }

  monthLabel(): string {
    const d = parseISODate(this.weekStart());
    return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
  }

  prevWeek(): void {
    this.weekStart.set(addDays(this.weekStart(), -7));
  }

  nextWeek(): void {
    this.weekStart.set(addDays(this.weekStart(), 7));
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  dayTasks() {
    return this.store.data().tasks.filter((t) => toDatePart(t.dueDate || '') === this.selectedDate() && t.status !== 'done');
  }

  formatDate = formatDate;

  formatTick(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}