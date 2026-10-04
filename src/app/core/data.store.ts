import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AppData, Project, Task, ActivityEntry, Category, Urgency, Status } from './models';
import { DataRepository, emptyAppData } from './storage.repository';
import { seedData } from './seed';
import { todayISO, urgencyOrder, addDays, formatDate, formatDateTime } from './date.utils';
import { ConfirmService } from './confirm.service';

@Injectable({ providedIn: 'root' })
export class DataStore {
  private repo = inject(DataRepository);
  private confirm = inject(ConfirmService);
  private _data = signal<AppData>(this.repo.load());

  constructor() {
    try {
      if (this._data().projects.length === 0 && this._data().tasks.length === 0) {
        this._data.set(seedData());
      }
    } catch {
      // keep empty data on initialization failure
    }
  }

  private readonly _persistEffect = effect(() => {
    const current = this._data();
    this.repo.save(current);
  });

  data = this._data.asReadonly();

  todayTasks = computed(() => {
    const t = todayISO();
    return this._data().tasks.filter((tk) => {
      if (tk.status === 'done') return false;
      if (tk.urgency === 'critical') return true;
      if (tk.dueDate === t) return true;
      if (tk.dueDate && tk.dueDate < t) return true;
      return false;
    });
  });

  pendingTasks = computed(() => {
    const statuses: Status[] = ['todo', 'in_progress', 'postponed'];
    return this._data().tasks.filter((tk) => statuses.includes(tk.status));
  });

  urgentTasks = computed(() => {
    return this._data().tasks
      .filter((tk) => tk.status !== 'done' && (tk.urgency === 'critical' || tk.urgency === 'high'))
      .sort((a, b) => urgencyOrder(a.urgency) - urgencyOrder(b.urgency) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  });

  nextSteps = computed(() => {
    const items: { kind: 'task' | 'project'; id: string; title: string; nextStep: string; urgency: Urgency }[] = [];
    for (const p of this._data().projects) {
      if (p.nextStep && p.status !== 'done') {
        items.push({ kind: 'project', id: p.id, title: p.name, nextStep: p.nextStep, urgency: p.urgency });
      }
    }
    for (const t of this._data().tasks) {
      if (t.nextStep && t.status !== 'done') {
        items.push({ kind: 'task', id: t.id, title: t.title, nextStep: t.nextStep, urgency: t.urgency });
      }
    }
    items.sort((a, b) => urgencyOrder(a.urgency) - urgencyOrder(b.urgency));
    return items.slice(0, 6);
  });

  statsByCategory = computed(() => {
    const stats: Record<Category, { total: number; done: number; percent: number }> = {
      professional: { total: 0, done: 0, percent: 0 },
      personal: { total: 0, done: 0, percent: 0 },
      household: { total: 0, done: 0, percent: 0 },
    };
    for (const t of this._data().tasks) {
      stats[t.category].total++;
      if (t.status === 'done') stats[t.category].done++;
    }
    for (const cat of Object.keys(stats) as Category[]) {
      stats[cat].percent = stats[cat].total === 0 ? 0 : Math.round((stats[cat].done / stats[cat].total) * 100);
    }
    return stats;
  });

  completedThisWeek = computed(() => {
    const weekAgo = addDays(todayISO(), -7);
    return this._data().tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt >= weekAgo).length;
  });

  addProject(input: Omit<Project, 'id' | 'activity' | 'createdAt' | 'updatedAt'>): void {
    const name = input.name?.trim();
    if (!name || name.length < 2) return;
    const now = new Date().toISOString();
    const project: Project = {
      ...input,
      name,
      id: crypto.randomUUID(),
      activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Projeto criado' }],
      createdAt: now,
      updatedAt: now,
    };
    this._data.update((d) => ({ ...d, projects: [...d.projects, project] }));
  }

  updateProject(id: string, patch: Partial<Project>): void {
    const now = new Date().toISOString();
    const entries: ActivityEntry[] = [];
    if (patch.nextStep) {
      entries.push({ id: crypto.randomUUID(), at: now, type: 'next_step_changed', message: 'Próximo passo atualizado' });
    }
    this._data.update((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now, activity: [...p.activity, ...entries] } : p)),
    }));
  }

  async deleteProject(id: string): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar projeto?',
      message: 'Isto vai apagar o projeto e todas as suas tarefas. Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    const now = new Date().toISOString();
    this._data.update((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
      tasks: d.tasks.filter((t) => t.projectId !== id),
    }));
  }

  addTask(input: Omit<Task, 'id' | 'activity' | 'createdAt' | 'updatedAt' | 'completedAt'>): void {
    const title = input.title?.trim();
    if (!title || title.length < 2) return;
    const now = new Date().toISOString();
    const task: Task = {
      ...input,
      title,
      id: crypto.randomUUID(),
      activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Tarefa criada' }],
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this._data.update((d) => ({ ...d, tasks: [...d.tasks, task] }));
  }

  updateTask(id: string, patch: Partial<Task>): void {
    const now = new Date().toISOString();
    const entries: ActivityEntry[] = [];
    if (patch.status) {
      entries.push({ id: crypto.randomUUID(), at: now, type: 'status_changed', message: `Estado alterado para ${patch.status}` });
    }
    if (patch.nextStep) {
      entries.push({ id: crypto.randomUUID(), at: now, type: 'next_step_changed', message: 'Próximo passo atualizado' });
    }
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: now, activity: [...t.activity, ...entries] } : t)),
    }));
  }

  async deleteTask(id: string): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar tarefa?',
      message: 'Isto vai apagar a tarefa permanentemente.',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== id),
    }));
  }

  setTaskStatus(id: string, status: Status): void {
    const now = new Date().toISOString();
    const task = this._data().tasks.find((t) => t.id === id);
    if (!task) return;
    const patch: Partial<Task> = { status, updatedAt: now };
    if (status === 'done') {
      patch.completedAt = now;
    }
    this.updateTask(id, patch);
  }

  postponeTask(id: string, newDate: string): void {
    const now = new Date().toISOString();
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: newDate,
              status: 'postponed',
              updatedAt: now,
              activity: [...t.activity, { id: crypto.randomUUID(), at: now, type: 'postponed', message: `Adiada para ${formatDate(newDate)}` }],
            }
          : t
      ),
    }));
  }

  addNote(entity: 'project' | 'task', id: string, text: string): void {
    const now = new Date().toISOString();
    const entry: ActivityEntry = { id: crypto.randomUUID(), at: now, type: 'note', message: text };
    if (entity === 'project') {
      this._data.update((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === id ? { ...p, activity: [...p.activity, entry], updatedAt: now } : p)),
      }));
    } else {
      this._data.update((d) => ({
        ...d,
        tasks: d.tasks.map((t) => (t.id === id ? { ...t, activity: [...t.activity, entry], updatedAt: now } : t)),
      }));
    }
  }

  replaceAll(data: AppData): void {
    this._data.set(data);
  }

  exportJson(): string {
    return JSON.stringify(this._data(), null, 2);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, theme } }));
  }

  setUserName(name: string): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, userName: name } }));
  }

  clearAll(): void {
    this._data.set(emptyAppData());
  }
}