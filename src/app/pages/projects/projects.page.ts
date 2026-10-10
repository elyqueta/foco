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
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { Project, Category } from '../../core/models';
import { formatDate } from '../../core/date.utils';
import { categoryLabel } from '../../core/category.utils';
import { SearchService } from '../../core/search.service';
import { AppButtonComponent } from '../../shared/ui/button.component';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, ModalComponent, ProjectFormComponent, ProgressRingComponent, BadgeUrgencyComponent, BadgeCategoryComponent, AppButtonComponent, SkeletonComponent],
  templateUrl: './projects.page.html',
})
export class ProjectsPage {
  private store = inject(DataStore);
  private search = inject(SearchService);
  showModal = signal(false);
  filter = signal<string>('all');
  searchQuery = this.search.query;
  saving = signal(false);

  loading = this.store.loading;
  loadError = this.store.loadError;

  filters() {
    const cats = this.store.categories();
    return [
      { label: 'Todas', value: 'all' },
      ...cats.map((c) => ({ label: categoryLabel(c), value: c })),
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

  async onSubmit(patch: Partial<Project>): Promise<void> {
    const name = patch.name?.trim();
    if (!name || name.length < 2 || this.saving()) return;
    this.saving.set(true);
    const created = await this.store.addProject({
      name,
      description: patch.description ?? '',
      category: patch.category ?? this.store.categories()[0] ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'active',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      color: patch.color ?? '#6C5CE7',
    });
    this.saving.set(false);
    if (created) this.closeModal();
  }

  progress(projectId: string): number {
    return this.store.projectStats().get(projectId)?.percent ?? 0;
  }

  doneCount(projectId: string): number {
    return this.store.projectStats().get(projectId)?.done ?? 0;
  }

  totalCount(projectId: string): number {
    return this.store.projectStats().get(projectId)?.total ?? 0;
  }

  retry(): void {
    this.store.retryLoad();
  }

  formatDate = formatDate;
}