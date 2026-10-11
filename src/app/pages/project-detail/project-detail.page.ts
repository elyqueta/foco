import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { TaskFormComponent } from '../../shared/ui/task-form.component';
import { ProjectFormComponent } from '../../shared/ui/project-form.component';
import { TaskRowComponent } from '../../shared/ui/task-row.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { formatDate } from '../../core/date.utils';
import { activityLabel } from '../../core/activity.utils';
import { Task, Project, ActivityEntry } from '../../core/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, ModalComponent, TaskFormComponent, ProjectFormComponent, TaskRowComponent, AppIconComponent, AppButtonComponent, SkeletonComponent],
  templateUrl: './project-detail.page.html',
})
export class ProjectDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
  private router = inject(Router);
  showTaskModal = signal(false);
  showEditProject = signal(false);
  projectForm = signal<Partial<Project>>({});

  private readonly projectId = signal<string | null>(null);
  detailLoading = signal(false);

  /** Derivado da store: notas e edições refletem-se sem recarregar a página. */
  project = computed(() => {
    const id = this.projectId();
    if (!id) return null;
    return this.store.data().projects.find((p) => p.id === id) ?? null;
  });

  projectTasks = computed(() => {
    const p = this.project();
    if (!p) return [];
    return this.store.data().tasks.filter((t) => t.projectId === p.id);
  });

  progress = computed(() => this.store.projectStats().get(this.project()?.id ?? '')?.percent ?? 0);

  /** Contexto passado ao formulário de tarefas: projeto e categoria já preenchidos. */
  taskProjectContext = computed(() => {
    const p = this.project();
    return p ? { id: p.id, category: p.category } : null;
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.projectId.set(id);
      if (!id) return;
      if (this.store.useApi) {
        this.detailLoading.set(true);
        void this.store.fetchProjectDetail(id).then(() => {
          // Ignora respostas de pedidos antigos (navegação rápida entre projetos).
          if (this.projectId() === id) this.detailLoading.set(false);
        });
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { active: 'Ativo', paused: 'Pausado', done: 'Concluído' };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-fg',
      paused: 'rounded-full bg-warn-soft px-2.5 py-1 text-[10px] font-bold text-warn',
      done: 'rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success',
    };
    return map[status] ?? 'rounded-full bg-surface-line px-2.5 py-1 text-[10px] font-bold text-ink-500';
  }

  formatDate = formatDate;

  openTaskModal(): void {
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
  }

  async onTaskSubmit(patch: Partial<Task>): Promise<void> {
    const p = this.project()?.id;
    if (!p) return;
    if (!patch.title || patch.title.trim().length < 2) return;
    const created = await this.store.addTask({
      title: patch.title.trim(),
      description: patch.description ?? '',
      category: patch.category ?? this.store.categories()[0] ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'todo',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      estimateMinutes: patch.estimateMinutes ?? null,
      tags: patch.tags ?? [],
      projectId: p,
    });
    if (created) this.closeTaskModal();
  }

  async toggleTask(id: string): Promise<void> {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    await this.store.setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  }

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  addNote(text: string): void {
    const p = this.project()?.id;
    if (!p || !text.trim()) return;
    void this.store.addNote('project', p, text.trim());
  }

  async deleteProject(): Promise<void> {
    const p = this.project()?.id;
    if (!p) return;
    await this.store.deleteProject(p);
    this.router.navigate(['/projetos']);
  }

  openEditProject(): void {
    const p = this.project();
    if (p) {
      this.projectForm.set(p);
      this.showEditProject.set(true);
    }
  }

  closeEditProject(): void {
    this.showEditProject.set(false);
  }

  async onProjectSubmit(patch: Partial<Project>): Promise<void> {
    const p = this.project()?.id;
    if (!p) return;
    const changed = await this.store.updateProject(p, patch);
    if (changed) this.closeEditProject();
  }

  sortedActivity(): ActivityEntry[] {
    const activity = this.project()?.activity ?? [];
    return [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  labelOf = activityLabel;

  format(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }
}
