import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { ProjectFormComponent } from '../../shared/ui/project-form.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { Project, Category } from '../../core/models';
import { formatDate } from '../../core/date.utils';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, ModalComponent, ProjectFormComponent, ProgressRingComponent, BadgeUrgencyComponent, BadgeCategoryComponent],
  template: `
    <div class="mt-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-[28px] font-extrabold text-ink">Projetos</h1>
        <button (click)="openModal()" class="h-10 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white hover:bg-ink-700 shadow-card transition">Novo projeto</button>
      </div>

      <div class="flex items-center gap-3 mb-6">
        @for (f of filters(); track f) {
          <button (click)="setFilter(f.value)" class="rounded-full px-4 h-9 text-[12px] font-semibold transition" [class.bg-brand]="filter() === f.value" [class.text-white]="filter() === f.value" [class.bg-white]="filter() !== f.value" [class.text-ink-500]="filter() !== f.value" [class.border]="filter() !== f.value" [class.border-surface-line]="filter() !== f.value">{{ f.label }}</button>
        }
      </div>

      @if (filtered().length === 0) {
        <app-empty-state title="Sem projetos" message="Cria o teu primeiro projeto para começar." actionLabel="Novo projeto" (actionClick)="openModal()" />
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (p of filtered(); track p.id) {
            <div class="rounded-card bg-white p-5 shadow-card hover:shadow-float transition cursor-pointer" [routerLink]="['/projetos', p.id]">
              <div class="flex items-center gap-2 mb-3">
                <span class="h-3 w-3 rounded-full shrink-0" [style.background]="p.color"></span>
                <h3 class="text-[14px] font-semibold text-ink truncate">{{ p.name }}</h3>
              </div>
              <p class="text-[12px] text-ink-500 line-clamp-2 mb-4">{{ p.description || 'Sem descrição' }}</p>
              <div class="flex items-center gap-3 mb-3">
                <app-progress-ring [percent]="progress(p.id)" />
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-bold text-ink">Progresso</p>
                  <p class="text-[10px] text-ink-400">{{ doneCount(p.id) }} de {{ totalCount(p.id) }} tarefas</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <app-badge-urgency [urgency]="p.urgency" [canPostpone]="p.canPostpone" />
                <app-badge-category [category]="p.category" />
              </div>
            </div>
          }
        </div>
      }

      @if (showModal()) {
        <app-modal (close)="closeModal()">
          <h2 class="text-[18px] font-bold text-ink mb-4">Novo projeto</h2>
          <app-project-form (submit)="onSubmit($event)" (cancel)="closeModal()" />
        </app-modal>
      }
    </div>
  `,
})
export class ProjectsPage {
  private store = inject(DataStore);
  showModal = signal(false);
  filter = signal<string>('all');

  filters() {
    return [
      { label: 'Todas', value: 'all' },
      { label: 'Profissional', value: 'professional' },
      { label: 'Pessoal', value: 'personal' },
      { label: 'Doméstica', value: 'household' },
    ];
  }

  filtered() {
    const f = this.filter();
    const projects = this.store.data().projects;
    if (f === 'all') return projects;
    return projects.filter((p) => p.category === f);
  }

  setFilter(f: string): void {
    this.filter.set(f);
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(patch: Partial<Project>): void {
    this.store.addProject({
      name: patch.name ?? '',
      description: patch.description ?? '',
      category: patch.category ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'active',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      color: patch.color ?? '#6C5CE7',
    });
    this.closeModal();
  }

  progress(projectId: string): number {
    const tasks = this.store.data().tasks.filter((t) => t.projectId === projectId);
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100);
  }

  doneCount(projectId: string): number {
    return this.store.data().tasks.filter((t) => t.projectId === projectId && t.status === 'done').length;
  }

  totalCount(projectId: string): number {
    return this.store.data().tasks.filter((t) => t.projectId === projectId).length;
  }

  formatDate = formatDate;
}
