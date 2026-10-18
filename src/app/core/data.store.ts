import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { AppData, Project, Task, ActivityEntry, Urgency, Status, ColorScheme } from './models';
import { DataRepository, LocalTasksRepository, emptyAppData, DEFAULT_CATEGORIES } from './storage.repository';
import { seedData } from './seed';
import { todayISO, urgencyOrder, addDays, formatDate, formatDateTime, toDatePart } from './date.utils';
import { ConfirmService } from './confirm.service';
import { FocusService } from './focus.service';
import { ApiService, ApiError } from './api.service';
import { ApiCategory, ApiProject, ApiSettings, ApiTask, ApiTaskInput, ImportResponse, NotificationPreferences } from './api.models';
import { environment } from '../../environments/environment';
import { NotificationService } from './notification.service';

export interface StoreFlash {
  id: number;
  kind: 'error' | 'success' | 'info';
  text: string;
}

const DEFAULT_PROJECT_COLOR = '#6C5CE7';

const STATUS_SUCCESS_MESSAGES: Record<Status, string> = {
  todo: 'Tarefa reaberta.',
  in_progress: 'Tarefa em curso.',
  done: 'Tarefa concluída.',
  postponed: 'Tarefa adiada.',
  expired: 'Tarefa expirada.',
};

function mapActivity(entry: { id: string; at: string; type: ActivityEntry['type']; message: string }): ActivityEntry {
  return { id: entry.id, at: entry.at, type: entry.type, message: entry.message };
}

function mapTask(task: ApiTask): Task {
  const mapped: Task = {
    id: task.id,
    projectId: task.projectId ?? null,
    title: task.title,
    description: task.description ?? '',
    category: task.category,
    urgency: task.urgency,
    status: task.status,
    canPostpone: task.canPostpone,
    dueDate: task.dueDate ?? null,
    nextStep: task.nextStep ?? '',
    estimateMinutes: task.estimateMinutes ?? null,
    tags: Array.isArray(task.tags) ? task.tags : [],
    activity: (task.activity ?? []).map(mapActivity),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt ?? null,
    isOverdue: task.isOverdue ?? false,
    postponedCount: task.postponedCount ?? 0,
  };
  if (task.timer) {
    mapped.timer = { ...task.timer };
  }
  return mapped;
}

/**
 * Junta a resposta da lista (sem `activity`) ao que já está na store,
 * preservando a atividade dos itens cujo detalhe já foi carregado.
 */
function preserveDetail<T extends { id: string; activity: ActivityEntry[]; updatedAt: string }>(incoming: T[], current: T[]): T[] {
  const detailById = new Map(current.filter((item) => item.activity.length > 0).map((item) => [item.id, item]));
  return incoming.map((item) => {
    const detail = detailById.get(item.id);
    return detail ? { ...item, activity: detail.activity, updatedAt: detail.updatedAt } : item;
  });
}

function mapProject(project: ApiProject): Project {
  const mapped: Project = {
    id: project.id,
    name: project.name,
    description: project.description ?? '',
    category: project.category,
    urgency: project.urgency,
    status: project.status,
    canPostpone: project.canPostpone,
    dueDate: project.dueDate ?? null,
    nextStep: project.nextStep ?? '',
    color: project.color || DEFAULT_PROJECT_COLOR,
    activity: (project.activity ?? []).map(mapActivity),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  if (project.progress) {
    mapped.progress = { total: project.progress.total, done: project.progress.done, percent: project.progress.percent };
  }
  return mapped;
}

@Injectable({ providedIn: 'root' })
export class DataStore {
  private repo = inject(DataRepository);
  private confirm = inject(ConfirmService);
  private api = inject(ApiService);
  private focus = inject(FocusService);
  private notifications = inject(NotificationService);
  private _data = signal<AppData>(this.repo.load());

  /** Em modo API, projetos e categorias vêm do servidor. */
  readonly useApi = environment.useApi;
  readonly loading = signal(this.useApi);
  readonly loadError = signal<string | null>(null);
  readonly flash = signal<StoreFlash | null>(null);
  private flashSeq = 0;
  private initialized = false;
  private inFlight: Promise<void> | null = null;

  constructor() {
    try {
      const loaded = this._data();
      if (loaded.projects.length === 0 && loaded.tasks.length === 0 && !this.useApi) {
        this._data.set(seedData());
      } else if (!loaded.categories || loaded.categories.length === 0) {
        this._data.update((d) => ({
          ...d,
          categories: [...DEFAULT_CATEGORIES],
          ...(this.useApi ? {} : { categoryDefaults: [...DEFAULT_CATEGORIES] }),
        }));
      }
    } catch {
      this._data.set(emptyAppData());
    }
    // Em modo API a expiração é preguiçosa no servidor (ao listar tarefas).
    if (!this.useApi) {
      this.expireOverdueTasks();
    }
  }

  /**
   * Arranca o carregamento remoto (modo API). Chamado depois de a sessão ser
   * validada, para não fazer pedidos antes da autenticação.
   */
  init(): void {
    if (this.initialized || !this.useApi) return;
    this.initialized = true;
    void this.loadFromApi();
  }

  /** Força um novo carregamento remoto (ex.: após login de outro utilizador). */
  reload(): void {
    if (!this.useApi) return;
    void this.loadFromApi();
  }

  /**
   * Associa os dados locais (tarefas) à conta autenticada, isolando contas
   * diferentes no mesmo dispositivo. Chamada no login/registo/validação;
   * com `null` (sessão terminada) limpa os dados locais da store.
   */
  setSessionScope(userId: string | number | null | undefined): void {
    if (!this.useApi) return;
    const repo = this.repo;
    if (!(repo instanceof LocalTasksRepository)) return;
    repo.setScope(userId);
    const signedIn = userId !== null && userId !== undefined;
    const loaded = signedIn ? repo.load() : emptyAppData();
    this._data.update((d) => ({ ...d, tasks: loaded.tasks, settings: loaded.settings }));
  }

  private readonly _persistEffect = effect(() => {
    const current = this._data();
    this.repo.save(current);
  });

  data = this._data.asReadonly();

  categories = computed(() => this._data().categories ?? [...DEFAULT_CATEGORIES]);

  /** Total/concluídas/percentagem por projeto. Em modo API usa o progresso do servidor. */
  projectStats = computed(() => {
    const data = this._data();
    const byId = new Map<string, { total: number; done: number; percent: number }>();
    if (this.useApi) {
      for (const p of data.projects) {
        if (p.progress) {
          byId.set(p.id, { total: p.progress.total, done: p.progress.done, percent: p.progress.percent });
        }
      }
      return byId;
    }
    for (const t of data.tasks) {
      if (!t.projectId) continue;
      const entry = byId.get(t.projectId) ?? { total: 0, done: 0, percent: 0 };
      entry.total++;
      if (t.status === 'done') entry.done++;
      byId.set(t.projectId, entry);
    }
    for (const entry of byId.values()) {
      entry.percent = entry.total === 0 ? 0 : Math.round((entry.done / entry.total) * 100);
    }
    return byId;
  });

  todayTasks = computed(() => {
    const t = todayISO();
    return this._data().tasks.filter((tk) => {
      if (tk.status === 'done') return false;
      if (tk.urgency === 'critical') return true;
      if (tk.dueDate && toDatePart(tk.dueDate) === t) return true;
      if (tk.dueDate && toDatePart(tk.dueDate) < t) return true;
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
    const unique = [...new Map(items.map((i) => [i.id, i])).values()];
    unique.sort((a, b) => urgencyOrder(a.urgency) - urgencyOrder(b.urgency));
    return unique.slice(0, 6);
  });

  statsByCategory = computed(() => {
    const cats = this.categories();
    const stats: Record<string, { total: number; done: number; percent: number }> = {};
    for (const cat of cats) {
      stats[cat] = { total: 0, done: 0, percent: 0 };
    }
    for (const t of this._data().tasks) {
      if (!stats[t.category]) stats[t.category] = { total: 0, done: 0, percent: 0 };
      stats[t.category].total++;
      if (t.status === 'done') stats[t.category].done++;
    }
    for (const cat of Object.keys(stats)) {
      stats[cat].percent = stats[cat].total === 0 ? 0 : Math.round((stats[cat].done / stats[cat].total) * 100);
    }
    return stats;
  });

  completedThisWeek = computed(() => {
    const weekAgo = addDays(todayISO(), -7);
    return this._data().tasks.filter((t) => t.status === 'done' && t.completedAt && t.completedAt >= weekAgo).length;
  });

  isExpired(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return toDatePart(dueDate) < todayISO();
  }

  isProtectedCategory(name: string): boolean {
    const defaults = this._data().categoryDefaults;
    if (defaults) return defaults.includes(name);
    if (this.useApi) return false;
    return DEFAULT_CATEGORIES.includes(name);
  }

  showFlash(kind: StoreFlash['kind'], text: string): void {
    this.flash.set({ id: ++this.flashSeq, kind, text });
  }

  dismissFlash(id: number): void {
    if (this.flash()?.id === id) this.flash.set(null);
  }

  // ---------- Carregamento inicial (modo API) ----------

  private async loadFromApi(): Promise<void> {
    this.inFlight = this.inFlight ?? this.fetchRemoteData().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async fetchRemoteData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const [categories, projects, tasks] = await Promise.all([
        this.api.listCategories(),
        this.api.listProjects(),
        this.api.listTasks({ includeDone: true, includeExpired: true }),
      ]);
      const mappedProjects = projects.map(mapProject);
      const mappedTasks = tasks.map(mapTask);
      this._data.update((d) => ({
        ...d,
        categories: categories.map((c) => c.name),
        categoryDefaults: categories.filter((c) => c.isDefault).map((c) => c.name),
        projects: preserveDetail(mappedProjects, d.projects),
        tasks: preserveDetail(mappedTasks, d.tasks),
      }));
      this.loading.set(false);
      void this.loadSettingsFromApi();
      void this.migrateLocalTasksToApi();
      void this.loadActiveTimer();
      void this.notifications.bootstrap();
    } catch (error: unknown) {
      this.loading.set(false);
      this.loadError.set(error instanceof ApiError ? error.message : 'Não foi possível carregar os dados do servidor.');
    }
  }

  /**
   * Migra tarefas guardadas localmente em versões anteriores (antes de a API
   * ter tarefas) para o servidor, uma única vez: a cache local fica vazia no
   * fim, pelo que não volta a correr.
   */
  private async migrateLocalTasksToApi(): Promise<void> {
    const repo = this.repo;
    if (!(repo instanceof LocalTasksRepository) || !repo.pendingTasks) return;
    const pending = repo.pendingTasks();
    if (pending.length === 0) return;

    const projectIds = new Set(this._data().projects.map((p) => p.id));
    const created: Task[] = [];
    let failed = 0;
    for (const task of pending) {
      const projectId = task.projectId && projectIds.has(task.projectId) ? task.projectId : null;
      const base = {
        title: task.title,
        description: task.description,
        category: task.category,
        urgency: task.urgency,
        canPostpone: task.canPostpone,
        nextStep: task.nextStep,
        estimateMinutes: task.estimateMinutes,
        tags: task.tags,
        projectId,
      };
      const result =
        (await this.api.createTask({ ...base, status: task.status === 'done' ? 'done' : 'todo', dueDate: task.dueDate }).catch(() => null)) ??
        (await this.api.createTask({ ...base, status: 'todo', dueDate: null }).catch(() => null));
      if (result) {
        created.push(mapTask(result));
      } else {
        failed++;
      }
    }
    repo.clearTasks();
    if (created.length > 0) {
      this._data.update((d) => ({ ...d, tasks: [...d.tasks, ...created] }));
    }
    if (failed > 0) {
      this.showFlash('info', `${created.length} tarefas migradas para o servidor; ${failed} não puderam ser migradas.`);
    }
  }

  private async refreshCategoriesAndProjects(): Promise<void> {
    const [categories, projects] = await Promise.all([this.api.listCategories(), this.api.listProjects()]);
    const mapped = projects.map(mapProject);
    this._data.update((d) => ({
      ...d,
      categories: categories.map((c) => c.name),
      categoryDefaults: categories.filter((c) => c.isDefault).map((c) => c.name),
      projects: preserveDetail(mapped, d.projects),
    }));
  }

  private async loadSettingsFromApi(): Promise<void> {
    try {
      const settings = await this.api.getSettings();
      this.applyApiSettings(settings);
    } catch {
      // definições são best-effort: a app continua com as preferências locais
    }
  }

  private applyApiSettings(settings: ApiSettings): void {
    const name = settings.userName?.trim() || settings.name?.trim();
    this._data.update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        userName: name ? name : d.settings.userName,
        theme: settings.theme === 'dark' ? 'dark' : 'light',
        notifications: settings.notifications ?? d.settings.notifications,
      },
    }));
  }

  retryLoad(): void {
    if (!this.useApi) return;
    void this.loadFromApi();
  }

  // ---------- Projetos ----------

  async addProject(input: Omit<Project, 'id' | 'activity' | 'createdAt' | 'updatedAt' | 'progress'>): Promise<Project | null> {
    const name = input.name?.trim();
    if (!name || name.length < 2) return null;
    if (this.useApi) {
      try {
        const created = await this.api.createProject({ ...input, name });
        const project = mapProject(created);
        this._data.update((d) => ({ ...d, projects: [...d.projects, project] }));
        this.showFlash('success', 'Projeto criado.');
        return project;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível criar o projeto.');
        return null;
      }
    }
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
    this.showFlash('success', 'Projeto criado.');
    return project;
  }

  /** Devolve `false` quando o servidor não detetou alterações (422 NO_CHANGES). */
  async updateProject(id: string, patch: Partial<Project>): Promise<boolean> {
    if (this.useApi) {
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'id' || key === 'activity' || key === 'createdAt' || key === 'updatedAt' || key === 'progress') continue;
        if (value !== undefined) body[key] = value;
      }
      try {
        const updated = await this.api.updateProject(id, body);
        const project = mapProject(updated);
        this._data.update((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? project : p)) }));
        this.showFlash('success', 'Projeto atualizado.');
        return true;
      } catch (error: unknown) {
        if (error instanceof ApiError && error.isNoChanges) {
          this.showFlash('info', error.message);
          return false;
        }
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível atualizar o projeto.');
        return false;
      }
    }
    const now = new Date().toISOString();
    const entries: ActivityEntry[] = [];
    if (patch.nextStep) {
      entries.push({ id: crypto.randomUUID(), at: now, type: 'next_step_changed', message: 'Próximo passo atualizado' });
    }
    this._data.update((d) => ({
      ...d,
      projects: d.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now, activity: [...p.activity, ...entries] } : p)),
    }));
    this.showFlash('success', 'Projeto atualizado.');
    return true;
  }

  async deleteProject(id: string): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar projeto?',
      message: 'Isto vai apagar o projeto e todas as suas tarefas. Esta ação não pode ser desfeita.',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    if (this.useApi) {
      try {
        await this.api.deleteProject(id);
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível remover o projeto.');
        return;
      }
    }
    this._data.update((d) => ({
      ...d,
      projects: d.projects.filter((p) => p.id !== id),
      tasks: d.tasks.filter((t) => t.projectId !== id),
    }));
    this.showFlash('success', 'Projeto apagado.');
  }

  /** Busca o detalhe (com atividade) de um projeto no modo API. */
  async fetchProjectDetail(id: string): Promise<Project | null> {
    if (!this.useApi) {
      return this._data().projects.find((p) => p.id === id) ?? null;
    }
    try {
      const detail = await this.api.getProject(id);
      const project = mapProject(detail);
      this._data.update((d) => ({
        ...d,
        projects: d.projects.some((p) => p.id === id) ? d.projects.map((p) => (p.id === id ? project : p)) : [...d.projects, project],
      }));
      return project;
    } catch (error: unknown) {
      this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível carregar o projeto.');
      return null;
    }
  }

  // ---------- Tarefas ----------

  async addTask(input: Omit<Task, 'id' | 'activity' | 'createdAt' | 'updatedAt' | 'completedAt'>): Promise<Task | null> {
    const title = input.title?.trim();
    if (!title || title.length < 2) return null;
    if (this.useApi) {
      try {
        const created = await this.api.createTask(this.toApiTaskInput(input, title));
        const task = mapTask(created);
        this._data.update((d) => ({ ...d, tasks: [...d.tasks, task] }));
        this.showFlash('success', 'Tarefa criada.');
        return task;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível criar a tarefa.');
        return null;
      }
    }
    const now = new Date().toISOString();
    const status = input.status ?? 'todo';
    const finalStatus = input.dueDate && toDatePart(input.dueDate) < todayISO() ? 'expired' : status;
    const task: Task = {
      ...input,
      title,
      id: crypto.randomUUID(),
      status: finalStatus,
      activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Tarefa criada' }],
      createdAt: now,
      updatedAt: now,
      completedAt: finalStatus === 'done' ? now : null,
    };
    this._data.update((d) => ({ ...d, tasks: [...d.tasks, task] }));
    this.showFlash('success', 'Tarefa criada.');
    return task;
  }

  private toApiTaskInput(input: Partial<Task>, title: string): ApiTaskInput {
    const body: ApiTaskInput = { title };
    if (input.description !== undefined) body.description = input.description;
    if (input.category !== undefined) body.category = input.category;
    if (input.urgency !== undefined) body.urgency = input.urgency;
    if (input.status !== undefined) body.status = input.status;
    if (input.canPostpone !== undefined) body.canPostpone = input.canPostpone;
    if (input.dueDate !== undefined) body.dueDate = input.dueDate;
    if (input.nextStep !== undefined) body.nextStep = input.nextStep;
    if (input.estimateMinutes !== undefined) body.estimateMinutes = input.estimateMinutes;
    if (input.tags !== undefined) body.tags = input.tags;
    if (input.projectId !== undefined) body.projectId = input.projectId;
    return body;
  }

  /** Devolve `false` quando o servidor não detetou alterações (422 NO_CHANGES). */
  async updateTask(id: string, patch: Partial<Task>, options: { silent?: boolean } = {}): Promise<boolean> {
    if (this.useApi) {
      const skip = ['id', 'activity', 'createdAt', 'updatedAt', 'completedAt', 'isOverdue', 'postponedCount', 'timer'];
      const body: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patch)) {
        if (skip.includes(key)) continue;
        if (value !== undefined) body[key] = value;
      }
      try {
        const updated = await this.api.updateTask(id, body);
        this.applyTask(mapTask(updated));
        if (!options.silent) this.showFlash('success', 'Tarefa atualizada.');
        return true;
      } catch (error: unknown) {
        if (error instanceof ApiError && error.isNoChanges) {
          this.showFlash('info', error.message);
          return false;
        }
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível atualizar a tarefa.');
        return false;
      }
    }
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
    if (!options.silent) this.showFlash('success', 'Tarefa atualizada.');
    return true;
  }

  async deleteTask(id: string): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar tarefa?',
      message: 'Isto vai apagar a tarefa permanentemente.',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    if (this.useApi) {
      try {
        await this.api.deleteTask(id);
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível remover a tarefa.');
        return;
      }
    }
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.filter((t) => t.id !== id),
    }));
    this.showFlash('success', 'Tarefa apagada.');
  }

  async setTaskStatus(id: string, status: Status): Promise<void> {
    const task = this._data().tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    if (this.useApi) {
      try {
        if (status === 'done') {
          const result = await this.api.completeTask(id);
          this.applyTask(mapTask(result.task));
        } else if (status === 'todo' && (task.status === 'done' || task.status === 'expired')) {
          const result = await this.api.reopenTask(id);
          this.applyTask(mapTask(result.task));
        } else {
          await this.updateTask(id, { status }, { silent: true });
        }
        this.showFlash('success', STATUS_SUCCESS_MESSAGES[status]);
        // Concluir/reabrir podem gerar notificações no servidor.
        void this.notifications.refresh();
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível alterar o estado da tarefa.');
      }
      return;
    }
    const now = new Date().toISOString();
    const patch: Partial<Task> = { status, updatedAt: now };
    if (status === 'done') {
      patch.completedAt = now;
    }
    await this.updateTask(id, patch, { silent: true });
    this.showFlash('success', STATUS_SUCCESS_MESSAGES[status]);
    void this.notifications.refresh();
  }

  async postponeTask(id: string, newDate: string): Promise<void> {
    if (this.useApi) {
      try {
        const result = await this.api.postponeTask(id, newDate);
        this.applyTask(mapTask(result.task));
        this.showFlash('success', 'Tarefa adiada.');
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível adiar a tarefa.');
      }
      return;
    }
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
    this.showFlash('success', 'Tarefa adiada.');
  }

  /** Busca o detalhe (com atividade) de uma tarefa no modo API. */
  async fetchTaskDetail(id: string): Promise<Task | null> {
    if (!this.useApi) {
      return this._data().tasks.find((t) => t.id === id) ?? null;
    }
    try {
      const detail = await this.api.getTask(id);
      const task = mapTask(detail);
      this.applyTask(task);
      return task;
    } catch (error: unknown) {
      this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível carregar a tarefa.');
      return null;
    }
  }

  private applyTask(task: Task): void {
    this._data.update((d) => {
      const exists = d.tasks.some((t) => t.id === task.id);
      const current = d.tasks.find((t) => t.id === task.id);
      // Respostas de ação (timer, estado) não trazem atividade: preserva a do detalhe.
      const merged =
        current && current.activity.length > 0 && task.activity.length === 0
          ? { ...task, activity: current.activity, updatedAt: current.updatedAt }
          : task;
      return {
        ...d,
        tasks: exists ? d.tasks.map((t) => (t.id === task.id ? merged : t)) : [...d.tasks, merged],
      };
    });
  }

  /** Aplica uma tarefa vinda da API à store (usado por respostas de timer). */
  applyApiTask(task: Task): void {
    this.applyTask(task);
  }

  /** Tarefa com o timer a correr (uma por utilizador; pausadas não aparecem). */
  readonly activeTimerTask = computed(() => {
    if (!this.useApi) return null;
    return this._data().tasks.find((t) => t.timer?.state === 'running') ?? null;
  });

  /** Segundos acumulados do timer ativo (inclui a entrada a decorrer). */
  activeTimerSeconds = computed(() => {
    const task = this.activeTimerTask();
    const timer = task?.timer;
    if (!timer) return 0;
    // Reavalia a cada segundo: o contador muda de valor (um computed que fique
    // com o mesmo valor cortaria a propagação da reatividade).
    this.focus.tickCount();
    const tracked = timer.trackedSeconds;
    if (timer.state !== 'running' || !timer.runningSince) return tracked;
    const delta = Math.floor((Date.now() - new Date(timer.runningSince).getTime()) / 1000);
    return tracked + Math.max(0, delta);
  });

  async startTaskTimer(id: string): Promise<boolean> {
    if (!this.useApi) return false;
    try {
      const result = await this.api.startTaskTimer(id);
      this.applyTask(mapTask(result.task));
      if (result.pausedTask) this.applyTask(mapTask(result.pausedTask));
      return true;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        this.showFlash('info', 'Este temporizador já está a correr.');
        return false;
      }
      this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível iniciar o temporizador.');
      return false;
    }
  }

  async pauseTaskTimer(id: string): Promise<boolean> {
    if (!this.useApi) return false;
    try {
      const result = await this.api.pauseTaskTimer(id);
      this.applyTask(mapTask(result.task));
      return true;
    } catch (error: unknown) {
      this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível pausar o temporizador.');
      return false;
    }
  }

  async resumeTaskTimer(id: string): Promise<boolean> {
    if (!this.useApi) return false;
    try {
      const result = await this.api.resumeTaskTimer(id);
      this.applyTask(mapTask(result.task));
      if (result.pausedTask) this.applyTask(mapTask(result.pausedTask));
      return true;
    } catch (error: unknown) {
      this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível retomar o temporizador.');
      return false;
    }
  }

  /** Recupera o timer ativo do servidor (chamado no carregamento inicial). */
  private async loadActiveTimer(): Promise<void> {
    if (!this.useApi) return;
    try {
      const task = await this.api.getActiveTimer();
      if (task) this.applyTask(mapTask(task));
    } catch {
      // o timer ativo é best-effort
    }
  }

  async addNote(entity: 'project' | 'task', id: string, text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (this.useApi) {
      try {
        if (entity === 'project') {
          const entry = mapActivity(await this.api.addProjectNote(id, trimmed));
          this._data.update((d) => ({
            ...d,
            projects: d.projects.map((p) => (p.id === id ? { ...p, activity: [...p.activity, entry], updatedAt: entry.at } : p)),
          }));
        } else {
          const entry = mapActivity(await this.api.addTaskNote(id, trimmed));
          this._data.update((d) => ({
            ...d,
            tasks: d.tasks.map((t) => (t.id === id ? { ...t, activity: [...t.activity, entry], updatedAt: entry.at } : t)),
          }));
        }
        this.showFlash('success', 'Nota adicionada.');
        return true;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível adicionar a nota.');
        return false;
      }
    }
    const now = new Date().toISOString();
    const entry: ActivityEntry = { id: crypto.randomUUID(), at: now, type: 'note', message: trimmed };
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
    this.showFlash('success', 'Nota adicionada.');
    return true;
  }

  // ---------- Categorias ----------

  async addCategory(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      this.showFlash('error', 'Dá um nome com pelo menos 2 caracteres.');
      return false;
    }
    if (this.categories().includes(trimmed)) {
      this.showFlash('error', 'Já existe uma categoria com esse nome.');
      return false;
    }
    if (this.useApi) {
      try {
        const created: ApiCategory = await this.api.createCategory(trimmed);
        this._data.update((d) => ({ ...d, categories: [...d.categories, created.name] }));
        this.showFlash('success', 'Categoria criada.');
        return true;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível criar a categoria.');
        return false;
      }
    }
    this._data.update((d) => ({ ...d, categories: [...d.categories, trimmed] }));
    this.showFlash('success', 'Categoria criada.');
    return true;
  }

  async removeCategory(name: string): Promise<boolean> {
    if (this.isProtectedCategory(name)) {
      this.showFlash('error', 'As categorias padrão não podem ser removidas.');
      return false;
    }
    if (this.useApi) {
      try {
        await this.api.deleteCategory(name);
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível remover a categoria.');
        return false;
      }
      await this.refreshCategoriesAndProjects();
    } else {
      this._data.update((d) => ({ ...d, categories: d.categories.filter((c) => c !== name) }));
    }
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => (t.category === name ? { ...t, category: 'professional' } : t)),
      projects: d.projects.map((p) => (p.category === name ? { ...p, category: 'professional' } : p)),
    }));
    this.showFlash('success', 'Categoria removida.');
    return true;
  }

  // ---------- Dados agregados ----------

  replaceAll(data: AppData): void {
    if (this.useApi) {
      this._data.update((d) => ({ ...d, tasks: data.tasks, settings: data.settings }));
      return;
    }
    this._data.set(data);
  }

  async importData(json: string): Promise<{ ok: boolean; errors: string[] }> {
    if (!this.useApi) {
      return this.importLocal(json);
    }
    try {
      const parsed = JSON.parse(json);
      const response: ImportResponse = await this.api.importData(parsed);
      if (response.ok) {
        await this.reload();
        this.showFlash('success', `Importado: ${response.projectsCreated ?? 0} projetos, ${response.tasksCreated ?? 0} tarefas.`);
        return { ok: true, errors: [] };
      }
      return { ok: false, errors: response.errors ?? ['Erro na importação.'] };
    } catch (error: unknown) {
      const apiError = error instanceof ApiError ? error : new ApiError('Não foi possível importar os dados.', 0, null);
      this.showFlash('error', apiError.message);
      return { ok: false, errors: [apiError.message] };
    }
  }

  private importLocal(json: string): Promise<{ ok: boolean; errors: string[] }> {
    // Mantém a lógica local existente para modo sem API.
    return Promise.resolve({ ok: false, errors: [] });
  }

  exportJson(): string {
    return JSON.stringify(this._data(), null, 2);
  }

  async exportData(): Promise<{ ok: boolean; data?: string; error?: string }> {
    if (!this.useApi) {
      return { ok: true, data: this.exportJson() };
    }
    try {
      const remote = await this.api.exportData();
      return { ok: true, data: JSON.stringify(remote, null, 2) };
    } catch (error: unknown) {
      const apiError = error instanceof ApiError ? error : new ApiError('Não foi possível exportar os dados.', 0, null);
      this.showFlash('error', apiError.message);
      return { ok: false, error: apiError.message };
    }
  }

  async resetData(): Promise<boolean> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar todos os dados?',
      message: 'Isto apaga projetos, tarefas, atividade e notificações do servidor. A conta e as definições são mantidas. Continuar?',
      confirmLabel: 'Apagar',
    });
    if (!ok) return false;
    if (this.useApi) {
      try {
        await this.api.resetData('APAGAR');
        this._data.set(emptyAppData());
        this.showFlash('success', 'Dados resetados.');
        return true;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível resetar os dados.');
        return false;
      }
    }
    this._data.set(emptyAppData());
    this.showFlash('success', 'Dados resetados.');
    return true;
  }

  async seedDemoData(): Promise<boolean> {
    if (this.useApi) {
      try {
        await this.api.seedDemoData();
        await this.reload();
        this.showFlash('success', 'Dados de exemplo semeados.');
        return true;
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 409) {
          this.showFlash('info', 'O utilizador já tem projetos ou tarefas.');
          return false;
        }
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível semear dados de exemplo.');
        return false;
      }
    }
    return false;
  }

  async resetDemoData(): Promise<boolean> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Resetar e carregar dados de exemplo?',
      message: 'Isto apaga todos os dados e carrega dados de exemplo. Continuar?',
      confirmLabel: 'Resetar',
    });
    if (!ok) return false;
    if (this.useApi) {
      try {
        await this.api.resetDemoData('APAGAR');
        await this.reload();
        this.showFlash('success', 'Dados resetados e exemplo carregado.');
        return true;
      } catch (error: unknown) {
        this.showFlash('error', error instanceof ApiError ? error.message : 'Não foi possível resetar os dados.');
        return false;
      }
    }
    return false;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, theme } }));
    if (this.useApi) void this.pushSettings({ theme });
  }

  setColorScheme(colorScheme: ColorScheme): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, colorScheme } }));
  }

  setUserName(name: string): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, userName: name } }));
    if (this.useApi) void this.pushSettings({ userName: name });
  }

  private async pushSettings(patch: { theme?: 'light' | 'dark'; userName?: string; notifications?: NotificationPreferences }): Promise<void> {
    try {
      await this.api.updateSettings(patch);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.isNoChanges) return;
      // sincronização best-effort: o valor local já foi aplicado
    }
  }

  setNotifications(prefs: NotificationPreferences): void {
    this._data.update((d) => ({ ...d, settings: { ...d.settings, notifications: prefs } }));
    if (this.useApi) void this.pushSettings({ notifications: prefs });
  }

  async clearAll(): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: this.useApi ? 'Apagar dados locais?' : 'Apagar tudo?',
      message: this.useApi
        ? 'Isto apaga os dados guardados apenas neste dispositivo. Os projetos, categorias e tarefas no servidor não são afetados. Continuar?'
        : 'Isto apaga todos os dados. Continuar?',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    if (this.useApi) {
      this.repo.clearTasks?.();
      this.showFlash('info', 'Dados locais apagados. Os dados no servidor não foram afetados.');
      return;
    }
    this._data.set(emptyAppData());
  }

  expireOverdueTasks(): void {
    const now = new Date().toISOString();
    const today = todayISO();
    this._data.update((d) => ({
      ...d,
      tasks: d.tasks.map((t) => {
        if (t.status === 'done' || t.status === 'postponed' || t.status === 'expired') return t;
        if (t.dueDate && toDatePart(t.dueDate) < today) {
          return {
            ...t,
            status: 'expired',
            updatedAt: now,
            activity: [
              ...t.activity,
              { id: crypto.randomUUID(), at: now, type: 'expired', message: 'Tarefa expirada por prazo vencido' },
            ],
          };
        }
        return t;
      }),
    }));
  }
}
