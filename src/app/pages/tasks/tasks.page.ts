import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { TaskFormComponent } from '../../shared/ui/task-form.component';
import { Task, Category } from '../../core/models';
import { formatDate } from '../../core/date.utils';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, ModalComponent, TaskFormComponent],
  templateUrl: './tasks.page.html',
})
export class TasksPage {
  private store = inject(DataStore);
  private router = inject(Router);
  showModal = signal(false);
  catFilter = signal<string>('all');
  urgencyFilter = signal<string>('all');

  catFilters() {
    return [
      { label: 'Todas', value: 'all' },
      { label: 'Profissional', value: 'professional' },
      { label: 'Pessoal', value: 'personal' },
      { label: 'Doméstica', value: 'household' },
    ];
  }

  urgencyFilters() {
    return [
      { label: 'Todas', value: 'all' },
      { label: 'Crítica', value: 'critical' },
      { label: 'Alta', value: 'high' },
      { label: 'Média', value: 'medium' },
      { label: 'Baixa', value: 'low' },
    ];
  }

  filtered() {
    let tasks = this.store.data().tasks;
    const cat = this.catFilter();
    const urg = this.urgencyFilter();
    if (cat !== 'all') tasks = tasks.filter((t) => t.category === cat);
    if (urg !== 'all') tasks = tasks.filter((t) => t.urgency === urg);
    return tasks;
  }

  grouped() {
    const tasks = this.filtered();
    const map = new Map<string, { key: string; label: string; tasks: Task[] }>();
    const order: Category[] = ['professional', 'personal', 'household'];
    const labels: Record<Category, string> = { professional: 'Profissional', personal: 'Pessoal', household: 'Doméstica' };
    for (const cat of order) {
      map.set(cat, { key: cat, label: labels[cat], tasks: [] });
    }
    for (const t of tasks) {
      if (!map.has(t.category)) map.set(t.category, { key: t.category, label: t.category, tasks: [] });
      map.get(t.category)!.tasks.push(t);
    }
    return Array.from(map.values()).filter((g) => g.tasks.length > 0);
  }

  setCatFilter(f: string): void {
    this.catFilter.set(f);
  }

  setUrgencyFilter(f: string): void {
    this.urgencyFilter.set(f);
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(patch: Partial<Task>): void {
    this.store.addTask({
      title: patch.title ?? '',
      description: patch.description ?? '',
      category: patch.category ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'todo',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      estimateMinutes: patch.estimateMinutes ?? null,
      tags: patch.tags ?? [],
      projectId: null,
    });
    this.closeModal();
  }

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  formatDate = formatDate;
}
