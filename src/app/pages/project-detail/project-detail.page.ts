import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { formatDate } from '../../core/date.utils';
import { Task, Project } from '../../core/models';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent, ModalComponent, TaskFormComponent, ProjectFormComponent, TaskRowComponent],
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

  formatDate = formatDate;
  formatDateTime = formatDate;

  openTaskModal(): void {
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
  }

  onTaskSubmit(patch: Partial<Task>): void {
    const p = this.project()?.id;
    if (!p) return;
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

  deleteProject(): void {
    const p = this.project()?.id;
    if (!p) return;
    this.store.deleteProject(p);
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
}
