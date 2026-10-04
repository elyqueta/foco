import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  template: `
    <div class="mt-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-[28px] font-extrabold text-ink">Tarefas</h1>
        <button (click)="openModal()" class="h-10 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white hover:bg-ink-700 shadow-card transition">Nova tarefa</button>
      </div>

      <div class="flex items-center gap-3 mb-6">
        @for (f of catFilters(); track f.value) {
          <button (click)="setCatFilter(f.value)" class="rounded-full px-4 h-9 text-[12px] font-semibold transition" [class.bg-brand]="catFilter() === f.value" [class.text-white]="catFilter() === f.value" [class.bg-white]="catFilter() !== f.value" [class.text-ink-500]="catFilter() !== f.value" [class.border]="catFilter() !== f.value" [class.border-surface-line]="catFilter() !== f.value">{{ f.label }}</button>
        }
        @for (f of urgencyFilters(); track f.value) {
          <button (click)="setUrgencyFilter(f.value)" class="rounded-full px-4 h-9 text-[12px] font-semibold transition" [class.bg-brand]="urgencyFilter() === f.value" [class.text-white]="urgencyFilter() === f.value" [class.bg-white]="urgencyFilter() !== f.value" [class.text-ink-500]="urgencyFilter() !== f.value" [class.border]="urgencyFilter() !== f.value" [class.border-surface-line]="urgencyFilter() !== f.value">{{ f.label }}</button>
        }
      </div>

      @if (filtered().length === 0) {
        <app-empty-state title="Sem tarefas" message="Adiciona a tua primeira tarefa." actionLabel="Nova tarefa" (actionClick)="openModal()" />
      } @else {
        <div class="flex flex-col gap-2">
          @for (group of grouped(); track group.key) {
            <div class="mb-4">
              <h3 class="text-[14px] font-bold text-ink mb-2">{{ group.label }}</h3>
              <div class="flex flex-col gap-1">
                @for (t of group.tasks; track t.id) {
                  <div class="rounded-2xl border border-surface-line p-4 hover:shadow-card transition cursor-pointer flex items-center justify-between" (click)="goTask(t.id)">
                    <div>
                      <p class="text-[14px] font-semibold text-ink" [class.line-through]="t.status === 'done'" [class.text-ink-400]="t.status === 'done'">{{ t.title }}</p>
                      <p class="text-[11px] text-ink-400">{{ formatDate(t.dueDate) }} &middot; {{ t.estimateMinutes ?? 0 }} min</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <app-badge-urgency [urgency]="t.urgency" [canPostpone]="t.canPostpone" />
                      <app-badge-category [category]="t.category" />
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (showModal()) {
        <app-modal (close)="closeModal()">
          <h2 class="text-[18px] font-bold text-ink mb-4">Nova tarefa</h2>
          <app-task-form (submit)="onSubmit($event)" (cancel)="closeModal()" />
        </app-modal>
      }
    </div>
  `,
})
export class TasksPage {
  private store = inject(DataStore);
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
    window.location.hash = `/tarefas/${id}`;
  }

  formatDate = formatDate;
}
