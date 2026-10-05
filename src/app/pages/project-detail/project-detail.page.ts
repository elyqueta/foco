import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { TaskFormComponent } from '../../shared/ui/task-form.component';
import { ProjectFormComponent } from '../../shared/ui/project-form.component';
import { TaskRowComponent } from '../../shared/ui/task-row.component';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { formatDate } from '../../core/date.utils';
import { Task, Project, ActivityEntry } from '../../core/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, ModalComponent, TaskFormComponent, ProjectFormComponent, TaskRowComponent, AppIconComponent, AppButtonComponent],
  templateUrl: './project-detail.page.html',
})
export class ProjectDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
  private router = inject(Router);
  showTaskModal = signal(false);
  showEditProject = signal(false);
  projectForm = signal<Partial<Project>>({});

  project = signal<Project | null>(null);
  projectTasks = signal<Task[]>([]);
  progress = signal(0);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const p = this.store.data().projects.find((x) => x.id === id);
        if (p) {
          this.project.set(p);
          const tasks = this.store.data().tasks.filter((t) => t.projectId === id);
          this.projectTasks.set(tasks);
          this.progress.set(tasks.length === 0 ? 0 : Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100));
        } else {
          this.project.set(null);
        }
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

  onTaskSubmit(patch: Partial<Task>): void {
    const p = this.project()?.id;
    if (!p) return;
    if (!patch.title || patch.title.trim().length < 2) return;
    this.store.addTask({
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
      projectId: p,
    });
    this.closeTaskModal();
  }

  toggleTask(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    this.store.setTaskStatus(id, task.status === 'done' ? 'todo' : 'done');
  }

  goTask(id: string): void {
    this.router.navigate(['/tarefas', id]);
  }

  addNote(text: string): void {
    const p = this.project()?.id;
    if (!p || !text.trim()) return;
    this.store.addNote('project', p, text.trim());
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

  onProjectSubmit(patch: Partial<Project>): void {
    const p = this.project()?.id;
    if (!p) return;
    this.store.updateProject(p, patch);
    this.closeEditProject();
  }

  sortedActivity(): ActivityEntry[] {
    const activity = this.project()?.activity ?? [];
    return [...activity].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }

  labelOf(type: ActivityEntry['type']): string {
    const map: Record<ActivityEntry['type'], string> = {
      created: 'Criado',
      status_changed: 'Estado alterado',
      note: 'Nota',
      postponed: 'Adiado',
      edited: 'Editado',
      next_step_changed: 'Próximo passo atualizado',
      expired: 'Expirada',
    };
    return map[type] ?? type;
  }

  format(iso: string): string {
    return new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  }
}