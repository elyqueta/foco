import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataStore } from '../../core/data.store';
import { CardComponent } from '../../shared/ui/card.component';
import { BadgeUrgencyComponent } from '../../shared/ui/badge-urgency.component';
import { BadgeCategoryComponent } from '../../shared/ui/badge-category.component';
import { ProgressRingComponent } from '../../shared/ui/progress-ring.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';
import { formatDate } from '../../core/date.utils';
import { Task } from '../../core/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, BadgeUrgencyComponent, BadgeCategoryComponent, EmptyStateComponent],
  template: `
    @if (task(); as task) {
      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-[28px] font-extrabold text-ink">{{ task.title }}</h1>
          <div class="flex gap-3">
            <button (click)="completeTask()" class="h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white hover:bg-brand-600 transition">Concluir</button>
            <button (click)="deleteTask()" class="h-10 rounded-xl border border-danger text-danger px-5 text-[13px] font-semibold hover:bg-danger-soft transition">Apagar</button>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-6">
          <app-badge-urgency [urgency]="task.urgency" [canPostpone]="task.canPostpone" />
          <app-badge-category [category]="task.category" />
          <span class="text-[12px] text-ink-500">{{ formatDate(task.dueDate) }}</span>
          <span class="text-[12px] font-semibold" [class.text-success]="task.status === 'done'" [class.text-ink-500]="task.status !== 'done'">{{ statusLabel(task.status) }}</span>
        </div>

        <div class="grid grid-cols-12 gap-5">
          <div class="col-span-12 lg:col-span-8">
            <app-card title="Descrição" [actionLabel]="null">
              <p class="text-[13px] text-ink whitespace-pre-wrap">{{ task.description || 'Sem descrição' }}</p>
            </app-card>

            <app-card title="Linha do tempo" class="mt-5">
              <div class="flex flex-col gap-4">
                @for (entry of task.activity.slice().reverse(); track entry.id) {
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

          <div class="col-span-12 lg:col-span-4">
            <app-card title="Detalhes" [actionLabel]="null">
              <div class="flex flex-col gap-3">
                <div>
                  <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Estado</label>
                  <select [value]="task.status" (change)="updateField('status', $any($event.target).value)" class="w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="todo">Por fazer</option>
                    <option value="in_progress">Em curso</option>
                    <option value="postponed">Adiada</option>
                    <option value="done">Concluída</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Urgência</label>
                  <select [value]="task.urgency" (change)="updateField('urgency', $any($event.target).value)" class="w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30">
                    <option value="critical">Crítica</option>
                    <option value="high">Alta</option>
                    <option value="medium">Média</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Prazo</label>
                  <input type="date" [value]="task.dueDate || ''" (change)="updateField('dueDate', $any($event.target).value)" class="w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Próximo passo</label>
                  <input type="text" [value]="task.nextStep" (change)="updateField('nextStep', $any($event.target).value)" class="w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div>
                  <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">Estimativa (min)</label>
                  <input type="number" [value]="task.estimateMinutes ?? ''" (change)="updateField('estimateMinutes', toNumber($any($event.target).value))" class="w-full rounded-xl border border-surface-line bg-white px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
                </div>
                <div class="flex items-center justify-between">
                  <label class="text-[13px] text-ink">Pode adiar</label>
                  <input type="checkbox" [checked]="task.canPostpone" (change)="updateField('canPostpone', $any($event.target).checked)" class="h-4 w-4 rounded border-surface-line accent-brand" />
                </div>
                @if (task.canPostpone) {
                  <button (click)="postpone()" class="h-10 rounded-xl border border-brand text-brand px-5 text-[13px] font-semibold hover:bg-brand-50 transition">Adiar tarefa</button>
                } @else {
                  <p class="text-[11px] text-ink-400">Esta tarefa não pode ser adiada.</p>
                }
              </div>
            </app-card>
          </div>
        </div>
      </div>
    } @else {
      <div class="mt-8">
        <app-empty-state title="Tarefa não encontrada" message="A tarefa que procuras não existe." />
      </div>
    }
  `,
})
export class TaskDetailPage {
  private route = inject(ActivatedRoute);
  private store = inject(DataStore);
  task = signal<Task | null>(null);

  formatDate = formatDate;
  formatDateTime = formatDate;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        const t = this.store.data().tasks.find((x) => x.id === id);
        this.task.set(t ?? null);
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = { todo: 'Por fazer', in_progress: 'Em curso', postponed: 'Adiada', done: 'Concluída' };
    return map[status] ?? status;
  }

  toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  updateField(field: string, value: unknown): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.updateTask(id, { [field]: value } as Partial<Task>);
  }

  completeTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.setTaskStatus(id, 'done');
  }

  deleteTask(): void {
    const id = this.task()?.id;
    if (!id) return;
    this.store.deleteTask(id);
  }

  addNote(text: string): void {
    const id = this.task()?.id;
    if (!id || !text.trim()) return;
    this.store.addNote('task', id, text.trim());
  }

  postpone(): void {
    const id = this.task()?.id;
    if (!id) return;
    const newDate = prompt('Nova data (YYYY-MM-DD):');
    if (newDate && /^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      this.store.postponeTask(id, newDate);
    }
  }
}
