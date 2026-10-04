import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  template: `
    @if (project(); as project) {
      <div class="mt-8">
        <div class="flex items-center gap-3 mb-4">
          <span class="h-4 w-4 rounded-full shrink-0" [style.background]="project.color"></span>
          <h1 class="text-[28px] font-extrabold text-ink">{{ project.name }}</h1>
        </div>
        <div class="flex items-center gap-3 mb-6">
          <app-badge-urgency [urgency]="project.urgency" [canPostpone]="project.canPostpone" />
          <app-badge-category [category]="project.category" />
          <span class="text-[12px] text-ink-500">{{ formatDate(project.dueDate) }}</span>
          <span class="text-[12px] font-semibold" [class.text-success]="project.status === 'done'" [class.text-ink-500]="project.status !== 'done'">{{ statusLabel(project.status) }}</span>
          <div class="flex-1"></div>
          <button (click)="openEditProject()" class="text-[12px] text-ink-400 hover:text-brand transition">Editar</button>
          <button (click)="deleteProject()" class="text-[12px] text-danger hover:text-danger transition">Apagar</button>
        </div>

        <div class="h-2 rounded-full bg-surface-line mb-6">
          <div class="h-2 rounded-full bg-brand transition-all" [style.width.%]="progress()"></div>
        </div>

        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-12 lg:col-span-8">
            <app-card title="Próximo passo" [actionLabel]="null">
              <div class="rounded-card bg-brand-50 border border-brand/20 p-5">
                <p class="text-[13px] font-semibold text-ink">{{ project.nextStep || 'Sem próximo passo definido' }}</p>
              </div>
            </app-card>

            <app-card title="Tarefas do projeto" class="mt-5">
              @if (projectTasks().length === 0) {
                <app-empty-state title="Sem tarefas" message="Adiciona a primeira tarefa a este projeto." actionLabel="Adicionar tarefa" (actionClick)="openTaskModal()" />
              } @else {
                <div class="flex flex-col gap-1">
                  @for (t of projectTasks(); track t.id) {
                    <app-task-row [task]="t" (click)="goTask(t.id)" (toggle)="toggleTask(t.id)" />
                  }
                </div>
              }
              <button (click)="openTaskModal()" class="mt-4 rounded-2xl border-2 border-dashed border-brand/30 bg-brand-50 py-4 text-[13px] font-semibold text-brand flex items-center justify-center gap-2 hover:bg-brand-100 transition">
                <span class="h-6 w-6 rounded-md bg-brand text-white grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                </span>
                Adicionar tarefa a este projeto
              </button>
            </app-card>
          </div>

          <div class="col-span-12 lg:col-span-4">
            <app-card title="Linha do tempo">
              <div class="flex flex-col gap-4">
                @for (entry of project.activity.slice().reverse(); track entry.id) {
                  <div class="flex gap-3">
                    <div class="flex flex-col items-center">
                      <span class="h-2.5 w-2.5 rounded-full bg-brand -ml-[27px]"></span>
                      @if (!$last) {
                        <span class="w-0.5 flex-1 bg-surface-line"></span>
                      }
                    </div>
                    <div class="pl-2">
                      <p class="text-[13px] text-ink">{{ entry.message }}</p>
                      <p class="text-[11px] text-ink-400">{{ formatDateTime(entry.at) }}</p>
                    </div>
                  </div>
                }
              </div>
              <div class="mt-4">
                <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Adicionar nota</label>
                <div class="flex gap-2">
                  <input type="text" #noteInput class="flex-1 rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="Escreve uma nota..." (keydown.enter)="addNote(noteInput.value); noteInput.value=''" />
                  <button (click)="addNote(noteInput.value); noteInput.value=''" class="h-10 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-600 transition">Adicionar</button>
                </div>
              </div>
            </app-card>
          </div>
        </div>
      </div>

      @if (showTaskModal()) {
        <app-modal (close)="closeTaskModal()">
          <h2 class="text-[18px] font-bold text-ink mb-4">Nova tarefa</h2>
          <app-task-form (submit)="onTaskSubmit($event)" (cancel)="closeTaskModal()" />
        </app-modal>
      }

      @if (showEditProject()) {
        <app-modal (close)="closeEditProject()">
          <h2 class="text-[18px] font-bold text-ink mb-4">Editar projeto</h2>
          <app-project-form [project]="projectForm()" (submit)="onProjectSubmit($event)" (cancel)="closeEditProject()" />
        </app-modal>
      }
    } @else {
      <div class="mt-8">
        <app-empty-state title="Projeto não encontrado" message="O projeto que procuras não existe." />
      </div>
    }
  `,
})
export class ProjectDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
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
    window.location.hash = `/tarefas/${id}`;
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
