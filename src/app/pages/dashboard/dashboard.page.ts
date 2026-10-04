import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { TaskModalService } from '../../core/task-modal.service';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { TaskRowComponent } from '../../shared/ui/task-row.component';
import { Task, ActivityEntry } from '../../core/models';
import { formatDate, today } from '../../core/date.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, ProgressRingComponent, EmptyStateComponent, TaskRowComponent],
  templateUrl: './dashboard.page.html',
})
export class DashboardPage {
  private store = inject(DataStore);
  private modal = inject(TaskModalService);
  private router = inject(Router);

  todayTasks = this.store.todayTasks;
  pendingTasks = this.store.pendingTasks;
  urgentTasks = this.store.urgentTasks;
  nextSteps = this.store.nextSteps;
  statsByCategory = this.store.statsByCategory;
  completedThisWeek = this.store.completedThisWeek;

  userName = this.store.data().settings.userName;

  selectedDate = signal(today());
  weekStart = signal(today());

  focusTask(): Task | undefined {
    return this.urgentTasks()[0];
  }

  categories() {
    const stats = this.statsByCategory();
    return [
      { key: 'professional', label: 'Profissional', value: stats.professional },
      { key: 'personal', label: 'Pessoal', value: stats.personal },
      { key: 'household', label: 'Doméstica', value: stats.household },
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
    this.store.setTaskStatus(id, 'in_progress');
  }

  weekDays(): string[] {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  }

  weekDates() {
    const start = new Date(this.weekStart() + 'T00:00:00');
    const days: { num: number; full: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const full = d.toISOString().slice(0, 10);
      const inMonth = d.getMonth() === start.getMonth();
      days.push({ num: d.getDate(), full, inMonth });
    }
    return days;
  }

  monthLabel(): string {
    const d = new Date(this.weekStart() + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
  }

  prevWeek(): void {
    const next = new Date(this.weekStart() + 'T00:00:00');
    next.setDate(next.getDate() - 7);
    this.weekStart.set(next.toISOString().slice(0, 10));
  }

  nextWeek(): void {
    const next = new Date(this.weekStart() + 'T00:00:00');
    next.setDate(next.getDate() + 7);
    this.weekStart.set(next.toISOString().slice(0, 10));
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  dayTasks() {
    return this.store.data().tasks.filter((t) => t.dueDate === this.selectedDate() && t.status !== 'done');
  }

  formatDate = formatDate;
}
