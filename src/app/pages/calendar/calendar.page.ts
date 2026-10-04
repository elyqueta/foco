import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { TaskModalService } from '../../core/task-modal.service';
import { ConfirmService } from '../../core/confirm.service';
import { formatDate, toISODate, parseISODate, weekDaysMondayFirst, toDatePart } from '../../core/date.utils';
import { Task } from '../../core/models';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './calendar.page.html',
})
export class CalendarPage {
  private store = inject(DataStore);
  private router = inject(Router);
  private modal = inject(TaskModalService);
  private confirm = inject(ConfirmService);
  currentMonth = signal(new Date());
  selectedDate = signal(toISODate(new Date()));

  tasks(): Task[] {
    const d = parseISODate(this.selectedDate());
    const iso = toISODate(d);
    return this.store.data().tasks.filter((t) => toDatePart(t.dueDate || '') === iso);
  }

  monthLabel(): string {
    const d = parseISODate(this.selectedDate());
    return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
  }

  prevMonth(): void {
    const d = parseISODate(this.selectedDate());
    d.setMonth(d.getMonth() - 1);
    this.selectedDate.set(toISODate(d));
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  nextMonth(): void {
    const d = parseISODate(this.selectedDate());
    d.setMonth(d.getMonth() + 1);
    this.selectedDate.set(toISODate(d));
    this.currentMonth.set(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  goToday(): void {
    const today = new Date();
    this.selectedDate.set(toISODate(today));
    this.currentMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  calendarDays(): { date: Date; inMonth: boolean; tasks: Task[] }[] {
    const year = this.currentMonth().getFullYear();
    const month = this.currentMonth().getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = weekDaysMondayFirst(firstDay)[0];
    const days: { date: Date; inMonth: boolean; tasks: Task[] }[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      const iso = toISODate(d);
      const tasks = this.store.data().tasks.filter((t) => toDatePart(t.dueDate || '') === iso);
      days.push({ date: d, inMonth: d.getMonth() === month, tasks });
    }
    return days;
  }

  weekLabels(): string[] {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  }

  selectDate(iso: string): void {
    this.selectedDate.set(iso);
  }

  openDay(iso: string): void {
    this.router.navigate(['/calendario', iso]);
  }

  formatDate = formatDate;
  toISODate = toISODate;

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
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

  addTaskForDate(): void {
    this.modal.show(this.selectedDate());
  }
}