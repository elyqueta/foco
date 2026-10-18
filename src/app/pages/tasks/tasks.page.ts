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
import { AppIconComponent } from '../../shared/ui/icon.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { Task, Category } from '../../core/models';
import { formatDate } from '../../core/date.utils';
import { categoryLabel } from '../../core/category.utils';
import { SearchService } from '../../core/search.service';
import { AppButtonComponent } from '../../shared/ui/button.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, ModalComponent, TaskFormComponent, AppIconComponent, AppButtonComponent, SkeletonComponent],
  templateUrl: './tasks.page.html',
})
export class TasksPage {
  private store = inject(DataStore);
  private router = inject(Router);
  private search = inject(SearchService);
  showModal = signal(false);
  catFilter = signal<string>('all');
  urgencyFilter = signal<string>('all');
  showDone = signal(false);
  showExpired = signal(false);
  searchQuery = this.search.query;
  searchResults = this.search.results;

  loading = this.store.loading;
  loadError = this.store.loadError;

  retry(): void {
    this.store.retryLoad();
  }

  catFilters() {
    const cats = this.store.categories();
    return [
      { label: 'Todas', value: 'all' },
      ...cats.map((c) => ({ label: categoryLabel(c), value: c })),
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
    if (this.store.useApi) {
      const results = this.searchResults();
      if (!results) return [];
      const tasks = results.tasks.map((t) => {
        const project = this.store.data().projects.find((p) => p.id === t.projectId);
        return {
          id: t.id,
          title: t.title,
          description: '',
          category: t.category,
          urgency: 'medium' as const,
          status: t.status as any,
          canPostpone: true,
          dueDate: null,
          nextStep: '',
          estimateMinutes: null,
          tags: [],
          activity: [],
          createdAt: '',
          updatedAt: '',
          completedAt: null,
          projectId: t.projectId ?? null,
        } as Task;
      });
      let filtered = tasks;
      const cat = this.catFilter();
      const urg = this.urgencyFilter();
      if (cat !== 'all') filtered = filtered.filter((t) => t.category === cat);
      if (urg !== 'all') filtered = filtered.filter((t) => t.urgency === urg);
      const done = this.showDone();
      if (!done) filtered = filtered.filter((t) => t.status !== 'done');
      if (!this.showExpired()) filtered = filtered.filter((t) => t.status !== 'expired');
      return filtered;
    }
    let tasks = this.store.data().tasks;
    const cat = this.catFilter();
    const urg = this.urgencyFilter();
    if (cat !== 'all') tasks = tasks.filter((t) => t.category === cat);
    if (urg !== 'all') tasks = tasks.filter((t) => t.urgency === urg);
    const done = this.showDone();
    if (!done) {
      tasks = tasks.filter((t) => t.status !== 'done');
    }
    if (!this.showExpired()) {
      tasks = tasks.filter((t) => t.status !== 'expired');
    }
    return tasks;
  }

  grouped() {
    const tasks = this.filtered();
    const map = new Map<string, { key: string; label: string; tasks: Task[] }>();
    const order: Category[] = ['professional', 'personal', 'household'];
    for (const cat of order) {
      map.set(cat, { key: cat, label: categoryLabel(cat), tasks: [] });
    }
    for (const t of tasks) {
      if (!map.has(t.category)) map.set(t.category, { key: t.category, label: categoryLabel(t.category), tasks: [] });
      const group = map.get(t.category)!;
      const urgencyPriority = { critical: 0, high: 1, medium: 2, low: 3 };
      const insertIndex = group.tasks.findIndex((x) => (urgencyPriority[x.urgency] ?? 3) > (urgencyPriority[t.urgency] ?? 3));
      if (insertIndex === -1) {
        group.tasks.push(t);
      } else {
        group.tasks.splice(insertIndex, 0, t);
      }
    }
    return Array.from(map.values()).filter((g) => g.tasks.length > 0);
  }

  setCatFilter(f: string): void {
    this.catFilter.set(f);
  }

  setUrgencyFilter(f: string): void {
    this.urgencyFilter.set(f);
  }

  toggleShowDone(): void {
    this.showDone.update((v) => !v);
  }

  toggleShowExpired(): void {
    this.showExpired.update((v) => !v);
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  async onSubmit(patch: Partial<Task>): Promise<void> {
    if (!patch.title || patch.title.trim().length < 2) return;
    const created = await this.store.addTask({
      title: patch.title.trim(),
      description: patch.description ?? '',
      category: patch.category ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'todo',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      estimateMinutes: patch.estimateMinutes ?? null,
      tags: patch.tags ?? [],
      projectId: patch.projectId ?? null,
    });
    if (created) this.closeModal();
  }

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  toggleTask(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    this.store.setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  }

  taskMeta(t: Task): string[] {
    const parts: string[] = [];
    if (t.projectId) {
      const p = this.store.data().projects.find((x) => x.id === t.projectId);
      if (p) parts.push(p.name);
    }
    if (t.dueDate) parts.push(formatDate(t.dueDate));
    if (t.estimateMinutes) parts.push(`${t.estimateMinutes} min`);
    return parts;
  }

  formatDate = formatDate;
}