import { Injectable, inject } from '@angular/core';
import { DataStore } from './data.store';
import { AppData, Project, Task, Category, Urgency } from './models';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private store = inject(DataStore);

  import(json: string): { ok: boolean; errors: string[] } {
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

    const validCategories: Category[] = ['professional', 'personal', 'household'];
    const validUrgencies: Urgency[] = ['critical', 'high', 'medium', 'low'];

    const projects: Project[] = [];
    if (Array.isArray(parsed.projects)) {
      for (let i = 0; i < parsed.projects.length; i++) {
        const p = parsed.projects[i];
        if (!p.name) { errors.push(`projects[${i}]: nome é obrigatório`); continue; }
        const category = p.category as Category | undefined;
        const urgency = p.urgency as Urgency | undefined;
        if (category && !validCategories.includes(category)) {
          errors.push(`projects[${i}].category: valor inválido (${category})`);
        }
        if (urgency && !validUrgencies.includes(urgency)) {
          errors.push(`projects[${i}].urgency: valor inválido (${urgency})`);
        }
        const now = new Date().toISOString();
        projects.push({
          id: crypto.randomUUID(),
          name: p.name,
          description: p.description ?? '',
          category: category ?? 'professional',
          urgency: urgency ?? 'medium',
          status: 'active',
          canPostpone: p.canPostpone ?? true,
          dueDate: p.dueDate ?? null,
          nextStep: p.nextStep ?? '',
          color: p.color ?? '#6C5CE7',
          activity: [{ id: crypto.randomUUID(), at: now, type: 'created', message: 'Projeto importado' }],
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const tasks: Task[] = [];
    if (Array.isArray(parsed.tasks)) {
      for (let i = 0; i < parsed.tasks.length; i++) {
        const t = parsed.tasks[i];
        if (!t.title) { errors.push(`tasks[${i}]: título é obrigatório`); continue; }
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
          title: t.title,
          description: t.description ?? '',
          category: category ?? 'professional',
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

    const current = this.store.data();
    const merged: AppData = {
      schemaVersion: 1,
      projects: [...current.projects, ...projects],
      tasks: [...current.tasks, ...tasks],
      settings: current.settings,
      categories: current.categories ?? ['professional', 'personal', 'household'],
    };
    this.store.replaceAll(merged);
    return { ok: true, errors: [] };
  }
}
