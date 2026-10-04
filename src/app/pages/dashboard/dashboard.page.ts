import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { TaskRowComponent } from '../../shared/ui/task-row.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { TaskFormComponent } from '../../shared/ui/task-form.component';
import { Task, ActivityEntry } from '../../core/models';
import { formatDate, today } from '../../core/date.utils';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, ProgressRingComponent, EmptyStateComponent, TaskRowComponent, ModalComponent, TaskFormComponent],
  template: `
    <div class="mt-8">
      <div class="grid grid-cols-12 gap-5">
        <div class="col-span-12 lg:col-span-5">
          <h1 class="text-[36px] leading-[44px] font-extrabold tracking-tight text-ink">Olá, {{ userName }}! O que tens planeado para hoje?</h1>
          <p class="text-[14px] leading-[22px] text-ink-500 max-w-[420px] mt-2">Aqui está o que precisas de fazer hoje. Foca-te numa coisa de cada vez.</p>
        </div>
        <div class="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div class="rounded-card bg-white p-5 shadow-card flex flex-col justify-between h-[160px]">
            <div class="h-11 w-11 rounded-2xl bg-brand-100 text-brand grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="text-[32px] font-extrabold text-ink leading-none">{{ todayTasks().length }}</div>
              <div class="text-[13px] font-semibold text-ink">Hoje</div>
              <div class="text-[11px] text-ink-400">Tarefas para hoje</div>
            </div>
          </div>
          <div class="rounded-card bg-white p-5 shadow-card flex flex-col justify-between h-[160px]">
            <div class="h-11 w-11 rounded-2xl bg-brand-100 text-brand grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <div class="text-[32px] font-extrabold text-ink leading-none">{{ pendingTasks().length }}</div>
              <div class="text-[13px] font-semibold text-ink">Pendentes</div>
              <div class="text-[11px] text-ink-400">Por fazer ou em curso</div>
            </div>
          </div>
          <div class="rounded-card bg-white p-5 shadow-card flex flex-col justify-between h-[160px]">
            <div class="h-11 w-11 rounded-2xl bg-danger-soft text-danger grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
            </div>
            <div>
              <div class="text-[32px] font-extrabold text-ink leading-none">{{ urgentTasks().length }}</div>
              <div class="text-[13px] font-semibold text-ink">Urgentes</div>
              <div class="text-[11px] text-ink-400">Críticas e altas</div>
            </div>
          </div>
          <div class="rounded-card bg-white p-5 shadow-card flex flex-col justify-between h-[160px]">
            <div class="h-11 w-11 rounded-2xl bg-success-soft text-success grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div>
              <div class="text-[32px] font-extrabold text-ink leading-none">{{ completedThisWeek() }}</div>
              <div class="text-[13px] font-semibold text-ink">Concluídas</div>
              <div class="text-[11px] text-ink-400">Esta semana</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-12 gap-5">
        <div class="col-span-12 lg:col-span-5">
          <app-card title="Tarefas de hoje">
            @if (todayTasks().length === 0) {
              <app-empty-state title="Dia livre!" message="Adiciona a tua primeira tarefa." actionLabel="Nova tarefa" (actionClick)="openModal()" />
            } @else {
              <div class="flex flex-col gap-1">
                @for (task of todayTasks(); track task.id) {
                  <app-task-row [task]="task" [projectName]="projectName(task.projectId)" [dueLabel]="dueLabel(task)" (click)="goTask(task.id)" (toggle)="toggleTask(task.id)" />
                }
              </div>
            }
          </app-card>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <app-card title="Urgentes" [actionLabel]="null">
            <div class="flex flex-col gap-3">
              @for (task of urgentTasks(); track task.id) {
                <div class="rounded-2xl border border-surface-line p-4 hover:shadow-card transition cursor-pointer" (click)="goTask(task.id)">
                  <div class="flex items-center gap-2 mb-2">
                    <app-badge-category [category]="task.category" />
                    <span class="text-[10px] text-ink-400">{{ task.tags.join(', ') }}</span>
                  </div>
                  <p class="text-[15px] font-bold leading-snug text-ink">{{ task.title }}</p>
                  <div class="flex items-center justify-between mt-3">
                    <app-badge-urgency [urgency]="task.urgency" [canPostpone]="task.canPostpone" />
                    <span class="text-[11px] text-ink-400">{{ formatDate(task.dueDate) }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-[12px] text-ink-500">Nenhuma tarefa urgente.</p>
              }
              <button (click)="openModal()" class="rounded-2xl border-2 border-dashed border-brand/30 bg-brand-50 py-4 text-[13px] font-semibold text-brand flex items-center justify-center gap-2 hover:bg-brand-100 transition">
                <span class="h-6 w-6 rounded-md bg-brand text-white grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                </span>
                Adicionar tarefa
              </button>
            </div>
          </app-card>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <app-card title="Calendário">
            <div class="flex items-center justify-between mb-3">
              <button (click)="prevWeek()" class="h-6 w-6 rounded-full bg-surface-app grid place-items-center text-ink hover:bg-brand-100 transition">&lsaquo;</button>
              <span class="text-[13px] font-semibold text-ink">{{ monthLabel() }}</span>
              <button (click)="nextWeek()" class="h-6 w-6 rounded-full bg-surface-app grid place-items-center text-ink hover:bg-brand-100 transition">&rsaquo;</button>
            </div>
            <div class="grid grid-cols-7 text-center mb-2">
              @for (d of weekDays(); track d) {
                <div class="text-[10px] text-ink-400">{{ d }}</div>
              }
            </div>
            <div class="grid grid-cols-7 text-center gap-y-1">
              @for (day of weekDates(); track day.full) {
                <button (click)="selectDate(day.full)" class="h-7 w-7 rounded-full mx-auto grid place-items-center text-[12px] font-semibold transition" [class.bg-brand]="day.full === selectedDate()" [class.text-white]="day.full === selectedDate()" [class.text-ink]="day.full !== selectedDate()" [class.opacity-40]="!day.inMonth">{{ day.num }}</button>
              }
            </div>
            <div class="mt-4 flex flex-col gap-2">
              @for (t of dayTasks(); track t.id) {
                <div class="flex items-center gap-3 cursor-pointer" (click)="goTask(t.id)">
                  <div class="h-8 w-8 rounded-xl bg-brand-100 text-brand grid place-items-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[12px] font-semibold text-ink truncate">{{ t.title }}</p>
                    <p class="text-[10px] text-ink-400">{{ formatDate(t.dueDate) }}</p>
                  </div>
                </div>
              } @empty {
                <p class="text-[11px] text-ink-400">Sem tarefas neste dia.</p>
              }
            </div>
          </app-card>
        </div>

        <div class="col-span-12 lg:col-span-5">
          <app-card title="Próximos passos">
            <div class="flex flex-col gap-3">
              @for (item of nextSteps(); track item.id) {
                <div class="flex items-start gap-3 cursor-pointer" (click)="go(item.kind, item.id)">
                  <span class="mt-1.5 h-2 w-2 rounded-full bg-brand shrink-0"></span>
                  <div>
                    <p class="text-[13px] font-semibold text-ink">{{ item.nextStep }}</p>
                    <p class="text-[11px] text-ink-400">de {{ item.title }}</p>
                  </div>
                </div>
              } @empty {
                <p class="text-[12px] text-ink-500">Sem próximos passos.</p>
              }
            </div>
          </app-card>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-3">
          <div class="rounded-card bg-brand p-6 text-white flex flex-col items-center text-center gap-3 shadow-float">
            <h3 class="text-[20px] font-extrabold">Modo foco</h3>
            <p class="text-[12px] text-white/80">Faz só UMA coisa agora</p>
            @if (focusTask()) {
              <p class="text-[13px] font-semibold text-white/90">{{ focusTask()!.title }}</p>
              <button (click)="startFocus(focusTask()!.id)" class="h-10 rounded-xl bg-ink px-5 text-[13px] font-semibold text-white hover:bg-ink-700 transition">Começar</button>
            } @else {
              <p class="text-[12px] text-white/60">Sem tarefas urgentes agora.</p>
            }
          </div>
        </div>

        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <app-card title="Progresso por categoria">
            <div class="grid grid-cols-3 gap-3">
              @for (cat of categories(); track cat.key) {
                <div class="rounded-2xl border border-surface-line p-3 flex flex-col items-center">
                  <app-progress-ring [percent]="cat.value.percent" />
                  <span class="text-[11px] font-bold text-ink mt-1">{{ cat.label }}</span>
                  <span class="text-[10px] text-ink-400">{{ cat.value.done }} de {{ cat.value.total }}</span>
                </div>
              }
            </div>
          </app-card>
        </div>
      </div>
    </div>

    @if (showModal()) {
      <app-modal (close)="closeModal()">
        <h2 class="text-[18px] font-bold text-ink mb-4">Nova tarefa</h2>
        <app-task-form (submit)="onTaskSubmit($event)" (cancel)="closeModal()" />
      </app-modal>
    }
  `,
})
export class DashboardPage {
  private store = inject(DataStore);
  showModal = signal(false);

  todayTasks = this.store.todayTasks;
  pendingTasks = this.store.pendingTasks;
  urgentTasks = this.store.urgentTasks;
  nextSteps = this.store.nextSteps;
  statsByCategory = this.store.statsByCategory;
  completedThisWeek = this.store.completedThisWeek;

  userName = this.store.data().settings.userName;

  selectedDate = signal(today());
  weekStart = signal(today());

  focusTask(): Task | undefined {
    return this.urgentTasks()[0];
  }

  categories() {
    const stats = this.statsByCategory();
    return [
      { key: 'professional', label: 'Profissional', value: stats.professional },
      { key: 'personal', label: 'Pessoal', value: stats.personal },
      { key: 'household', label: 'Doméstica', value: stats.household },
    ];
  }

  projectName(projectId: string | null): string {
    if (!projectId) return 'Sem projeto';
    const p = this.store.data().projects.find((x) => x.id === projectId);
    return p ? p.name : 'Sem projeto';
  }

  dueLabel(task: Task): string {
    if (task.dueDate) return formatDate(task.dueDate);
    return 'Sem prazo';
  }

  toggleTask(id: string): void {
    const task = this.store.data().tasks.find((t) => t.id === id);
    if (!task) return;
    const next = task.status === 'done' ? 'todo' : 'done';
    this.store.setTaskStatus(id, next);
  }

  goTask(id: string): void {
    window.location.hash = `/tarefas/${id}`;
  }

  go(kind: 'task' | 'project', id: string): void {
    const path = kind === 'task' ? `/tarefas/${id}` : `/projetos/${id}`;
    window.location.hash = path;
  }

  openModal(): void {
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onTaskSubmit(patch: Partial<Task>): void {
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

  startFocus(id: string): void {
    this.store.setTaskStatus(id, 'in_progress');
  }

  weekDays(): string[] {
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  }

  weekDates() {
    const start = new Date(this.weekStart() + 'T00:00:00');
    const days: { num: number; full: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const full = d.toISOString().slice(0, 10);
      const inMonth = d.getMonth() === start.getMonth();
      days.push({ num: d.getDate(), full, inMonth });
    }
    return days;
  }

  monthLabel(): string {
    const d = new Date(this.weekStart() + 'T00:00:00');
    return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(d);
  }

  prevWeek(): void {
    const next = new Date(this.weekStart() + 'T00:00:00');
    next.setDate(next.getDate() - 7);
    this.weekStart.set(next.toISOString().slice(0, 10));
  }

  nextWeek(): void {
    const next = new Date(this.weekStart() + 'T00:00:00');
    next.setDate(next.getDate() + 7);
    this.weekStart.set(next.toISOString().slice(0, 10));
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
  }

  dayTasks() {
    return this.store.data().tasks.filter((t) => t.dueDate === this.selectedDate() && t.status !== 'done');
  }

  formatDate = formatDate;
}
