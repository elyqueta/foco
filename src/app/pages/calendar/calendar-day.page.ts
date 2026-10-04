import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { TaskModalService } from '../../core/task-modal.service';
import { ConfirmService } from '../../core/confirm.service';
import { toISODate, parseISODate, toDatePart, todayISO } from '../../core/date.utils';
import { Task } from '../../core/models';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-calendar-day-page',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, LucideAngularModule],
  templateUrl: './calendar-day.page.html',
})
export class CalendarDayPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(DataStore);
  private modal = inject(TaskModalService);
  private confirm = inject(ConfirmService);

  date = signal(toISODate(new Date()));

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const d = params.get('date');
      if (d) {
        this.date.set(d);
      }
    });
  }

  canAddTask(): boolean {
    return this.selectedDay() !== null && this.date() >= todayISO();
  }

  dayLabel(): string {
    const d = this.selectedDay();
    if (!d) return 'Data inválida';
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short' }).format(d);
  }

  private selectedDay(): Date | null {
    const date = this.date();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

    const parsed = parseISODate(date);
    return toISODate(parsed) === date ? parsed : null;
  }

  tasks(): Task[] {
    const iso = this.date();
    return this.store.data().tasks.filter((t) => toDatePart(t.dueDate || '') === iso);
  }

  formatDateTime(date: string | null): string {
    if (!date) return 'Sem prazo';
    const d = new Date(date);
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  }

  toggleTask(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    this.store.setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  }

  async deleteTask(id: string): Promise<void> {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar tarefa?',
      message: `Isto vai apagar "${task.title}" permanentemente.`,
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    this.store.deleteTask(id);
  }

  editTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  addTask(): void {
    if (!this.canAddTask()) return;
    this.modal.show(this.date());
  }

  back(): void {
    this.router.navigate(['/calendario']);
  }
}