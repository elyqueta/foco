import { Injectable, inject } from '@angular/core';
import { DataStore } from './data.store';
import { AppData, Project, Task, Category, Urgency } from './models';

interface ImportedProject {
  /** `id` original no ficheiro JSON, usado para ligar as tarefas ao projeto criado. */
  fileId: string | null;
  project: Project;
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  private store = inject(DataStore);

  async import(json: string): Promise<{ ok: boolean; errors: string[] }> {
    const errors: string[] = [];
    let parsed: { projects?: Partial<Project>[]; tasks?: Partial<Task>[] };
    try {
      parsed = JSON.parse(json);
    } catch {
      return { ok: false, errors: ['JSON inválido.'] };
    }
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, errors: ['Objeto raiz inválido.'] };
    }

    const validCategories: Category[] = this.store.categories();
    const validUrgencies: Urgency[] = ['critical', 'high', 'medium', 'low'];

    const importedProjects: ImportedProject[] = [];
    if (Array.isArray(parsed.projects)) {
      for (let i = 0; i < parsed.projects.length; i++) {
        const p = parsed.projects[i];
        if (!p.name || p.name.trim().length < 2) { errors.push(`projects[${i}]: nome é obrigatório (mín. 2 caracteres)`); continue; }
        const category = p.category as Category | undefined;
        const urgency = p.urgency as Urgency | undefined;
        if (category && !validCategories.includes(category)) {
          errors.push(`projects[${i}].category: valor inválido (${category})`);
        }
        if (urgency && !validUrgencies.includes(urgency)) {
          errors.push(`projects[${i}].urgency: valor inválido (${urgency})`);
        }
        const now = new Date().toISOString();
        const fileId = typeof p.id === 'string' && p.id ? p.id : null;
        importedProjects.push({
          fileId,
          project: {
            id: crypto.randomUUID(),
            name: p.name.trim(),
            description: p.description ?? '',
            category: category ?? validCategories[0] ?? 'professional',
            urgency: urgency ?? 'medium',
            status: 'active',
            canPostpone: p.canPostpone ?? true,
            dueDate: p.dueDate ?? null,
            nextStep: p.nextStep ?? '',
            color: p.color ?? '#6C5CE7',
            activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Projeto importado' }],
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    const tasks: Task[] = [];
    if (Array.isArray(parsed.tasks)) {
      for (let i = 0; i < parsed.tasks.length; i++) {
        const t = parsed.tasks[i];
        if (!t.title || t.title.trim().length < 2) { errors.push(`tasks[${i}]: título é obrigatório (mín. 2 caracteres)`); continue; }
        const category = t.category as Category | undefined;
        const urgency = t.urgency as Urgency | undefined;
        if (category && !validCategories.includes(category)) {
          errors.push(`tasks[${i}].category: valor inválido (${category})`);
        }
        if (urgency && !validUrgencies.includes(urgency)) {
          errors.push(`tasks[${i}].urgency: valor inválido (${urgency})`);
        }
        const now = new Date().toISOString();
        const dueDate = t.dueDate ?? null;
        const status = dueDate && new Date(dueDate).getTime() < new Date(new Date().toDateString()).getTime() ? 'expired' : 'todo';
        tasks.push({
          id: crypto.randomUUID(),
          projectId: t.projectId ?? null,
          title: t.title.trim(),
          description: t.description ?? '',
          category: category ?? validCategories[0] ?? 'professional',
          urgency: urgency ?? 'medium',
          status,
          canPostpone: t.canPostpone ?? true,
          dueDate,
          nextStep: t.nextStep ?? '',
          estimateMinutes: t.estimateMinutes ?? null,
          tags: Array.isArray(t.tags) ? t.tags : [],
          activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Tarefa importada' }],
          createdAt: now,
          updatedAt: now,
          completedAt: null,
        });
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    // Mapeia o id original do ficheiro para o id final de cada projeto criado.
    const byFileId = new Map<string, string>();
    const resolveProjectId = (fileRef: string | null): string | null => {
      if (!fileRef) return null;
      return byFileId.get(fileRef) ?? null;
    };

    if (this.store.useApi) {
      // Projetos são criados no servidor; as tarefas (sem endpoint) ficam locais.
      for (const { fileId, project } of importedProjects) {
        const created = await this.store.addProject(project);
        if (created) {
          if (fileId) byFileId.set(fileId, created.id);
        } else {
          errors.push(`projects: não foi possível criar "${project.name}"`);
        }
      }
      for (const task of tasks) {
        await this.store.addTask({ ...task, projectId: resolveProjectId(task.projectId) });
      }
      return { ok: errors.length === 0, errors };
    }

    for (const { fileId, project } of importedProjects) {
      if (fileId) byFileId.set(fileId, project.id);
    }
    const current = this.store.data();
    const merged: AppData = {
      schemaVersion: 1,
      projects: [...current.projects, ...importedProjects.map((i) => i.project)],
      tasks: [...current.tasks, ...tasks.map((t) => ({ ...t, projectId: resolveProjectId(t.projectId) }))],
      settings: current.settings,
      categories: current.categories ?? [...validCategories],
    };
    this.store.replaceAll(merged);
    return { ok: true, errors: [] };
  }
}
