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
import { SearchService } from '../../core/search.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, ModalComponent, ProjectFormComponent, ProgressRingComponent, BadgeUrgencyComponent, BadgeCategoryComponent],
  templateUrl: './projects.page.html',
})
export class ProjectsPage {
  private store = inject(DataStore);
  private search = inject(SearchService);
  showModal = signal(false);
  filter = signal<string>('all');
  searchQuery = this.search.query;

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
    let projects = this.store.data().projects;
    if (f !== 'all') projects = projects.filter((p) => p.category === f);
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      projects = projects.filter((p) => `${p.name} ${p.description ?? ''}`.toLowerCase().includes(query));
    }
    return projects;
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
    const name = patch.name?.trim();
    if (!name || name.length < 2) return;
    this.store.addProject({
      name,
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

  plural(n: number, singular: string, plural: string): string {
    return n === 1 ? singular : plural;
  }

  formatDate = formatDate;
}