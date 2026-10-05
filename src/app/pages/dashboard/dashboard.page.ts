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
import { FocoLogoComponent } from '../../shared/brand/foco-logo.component';
import { AuthService } from '../../core/auth/auth.service';
import { FocusService } from '../../core/focus.service';
import { Task, ActivityEntry } from '../../core/models';
import { formatDate, todayISO, weekDaysMondayFirst, parseISODate, addDays, toISODate, toDatePart } from '../../core/date.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, ProgressRingComponent, EmptyStateComponent, TaskRowComponent, AppIconComponent, AppButtonComponent, FocoLogoComponent],
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

  userName = computed(() => this.auth.user()?.name ?? this.store.data().settings.userName);

  selectedDate = signal(todayISO());
  weekStart = signal(todayISO());

  focusTask(): Task | undefined {
    return this.urgentTasks()[0];
  }

  focusSessionTask(): Task | undefined {
    const session = this.focus.session();
    if (!session) return undefined;
    return this.store.data().tasks.find((t) => t.id === session.taskId) ?? undefined;
  }

  focusTick = this.focus.tick;
  focusActive = this.focus.active;
  focusPaused = this.focus.paused;

  constructor() {
    this.focus.tick;
  }

  categories() {
    const stats = this.statsByCategory();
    return [
      { key: 'professional', label: 'Profissional', value: stats['professional'] },
      { key: 'personal', label: 'Pessoal', value: stats['personal'] },
      { key: 'household', label: 'Doméstica', value: stats['household'] },
    ];
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

  toggleTask(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = task.status === 'done' ? 'todo' : 'done';
    this.store.setTaskStatus(id, next);
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

  startFocus(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    this.store.setTaskStatus(id, 'in_progress');
    this.focus.start(task);
  }

  stopFocus(): void {
    this.focus.stop();
  }

  pauseFocus(): void {
    this.focus.pause();
  }

  resumeFocus(): void {
    this.focus.resume();
  }

  viewFocusTask(): void {
    const task = this.focus.session()?.taskId;
    if (task) {
      this.router.navigate(['/tarefas', task]);
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