import { Component, EventEmitter, Input, Output, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task, Project } from '../../core/models';
import { DataStore } from '../../core/data.store';
import { AppButtonComponent } from './button.component';
import { formatDate, toDatePart, todayISO, withDefaultDueTime } from '../../core/date.utils';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent],
  templateUrl: './task-form.component.html',
})
export class TaskFormComponent implements OnInit {
  private store = inject(DataStore);
  @Input() task?: Task;
  @Input() initialDueDate: string | null = null;
  /** Projeto de contexto (criação dentro de um projeto): preenche projeto e categoria. */
  @Input() initialProject: { id: string; category: string } | null = null;
  @Output() submit = new EventEmitter<Partial<Task>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<Partial<Task>>({});
  touched = signal(false);

  formatDate = formatDate;

  projects(): Project[] {
    return this.store.data().projects;
  }

  categoryOptions(): string[] {
    return this.store.categories();
  }

  selectedProject(): Project | null {
    const id = this.form().projectId;
    if (!id) return null;
    return this.store.data().projects.find((p) => p.id === id) ?? null;
  }

  /** Data máxima do prazo: fim do dia do prazo do projeto selecionado. */
  maxDueDateTime(): string {
    const project = this.selectedProject();
    if (!project?.dueDate) return '';
    return `${toDatePart(project.dueDate)}T23:59`;
  }

  dueDateError(): string {
    const due = this.form().dueDate;
    if (!due) return '';
    if (toDatePart(due) < todayISO()) return 'O prazo não pode ser num dia que já passou.';
    const max = this.maxDueDateTime();
    if (max && due > max) return `O prazo não pode passar do prazo do projeto (${formatDate(toDatePart(max))}).`;
    return '';
  }

  canSave(): boolean {
    const title = this.form().title?.trim() ?? '';
    return title.length >= 2 && !this.dueDateError();
  }

  dueDateTime(): string {
    const due = this.form().dueDate;
    if (!due) return '';
    const d = new Date(due);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  minDateTime(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  onDueDateTime(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update((f) => ({ ...f, dueDate: input.value || null }));
  }

  /** Ao escolher um projeto, a categoria passa a ser a do projeto. */
  onProjectChange(value: string): void {
    const projectId = value || null;
    const project = projectId ? this.store.data().projects.find((p) => p.id === projectId) : null;
    this.form.update((f) => ({ ...f, projectId, category: project?.category ?? f.category }));
  }

  ngOnInit(): void {
    if (this.initialProject) {
      this.form.update((f) => ({ ...f, projectId: this.initialProject!.id, category: this.initialProject!.category }));
    }
    if (this.initialDueDate) {
      this.form.update((f) => ({ ...f, dueDate: withDefaultDueTime(this.initialDueDate) }));
    }
  }

  /** Valida antes de emitir (o Enter num campo também submete o formulário). */
  onSubmit(): void {
    this.touched.set(true);
    if (!this.canSave()) return;
    this.submit.emit(this.form());
  }
}
