import { Injectable, inject } from '@angular/core';
import { DataStore } from './data.store';
import { ImportService } from './import.service';

export interface FocoConsoleApi {
  addTask(input: {
    title: string;
    category?: string;
    urgency?: string;
    projectName?: string;
    dueDate?: string;
    nextStep?: string;
    description?: string;
    canPostpone?: boolean;
    estimateMinutes?: number;
    tags?: string[];
  }): void;
  addProject(input: {
    name: string;
    category?: string;
    urgency?: string;
    dueDate?: string;
    nextStep?: string;
    description?: string;
  }): void;
  import(data: string | object): void;
  list(): void;
  today(): void;
  export(): string;
  clear(): void;
}

declare global {
  interface Window {
    foco: FocoConsoleApi;
  }
}

const validCategories = ['professional', 'personal', 'household'];
const validUrgencies = ['critical', 'high', 'medium', 'low'];

function pickCategory(c?: string): 'professional' | 'personal' | 'household' {
  return validCategories.includes(c as any) ? (c as any) : 'professional';
}

function pickUrgency(u?: string): 'critical' | 'high' | 'medium' | 'low' {
  return validUrgencies.includes(u as any) ? (u as any) : 'medium';
}

@Injectable({ providedIn: 'root' })
export class ConsoleApi {
  private store = inject(DataStore);
  private importService = inject(ImportService);

  init(): void {
    const api: FocoConsoleApi = {
      addTask: (input) => {
        const existingProject = input.projectName
          ? this.store.data().projects.find((p) => p.name.toLowerCase() === input.projectName!.toLowerCase())
          : null;
        const projectId = existingProject ? existingProject.id : null;
        const category = pickCategory(input.category);
        const urgency = pickUrgency(input.urgency);
        this.store.addTask({
          title: input.title,
          description: input.description ?? '',
          category,
          urgency,
          status: 'todo',
          canPostpone: input.canPostpone ?? true,
          dueDate: input.dueDate ?? null,
          nextStep: input.nextStep ?? '',
          estimateMinutes: input.estimateMinutes ?? null,
          tags: input.tags ?? [],
          projectId,
        });
        if (!existingProject && input.projectName) {
          this.store.addProject({
            name: input.projectName,
            category,
            urgency: pickUrgency(input.urgency),
            dueDate: input.dueDate ?? null,
            nextStep: input.nextStep ?? '',
            description: input.description ?? '',
            color: '#6C5CE7',
            status: 'active',
            canPostpone: true,
          });
        }
        console.log(`[foco] Tarefa criada: ${input.title}`);
      },
      addProject: (input) => {
        this.store.addProject({
          name: input.name,
          description: input.description ?? '',
          category: pickCategory(input.category),
          urgency: pickUrgency(input.urgency),
          status: 'active',
          canPostpone: true,
          dueDate: input.dueDate ?? null,
          nextStep: input.nextStep ?? '',
          color: '#6C5CE7',
        });
        console.log(`[foco] Projeto criado: ${input.name}`);
      },
      import: (data) => {
        const json = typeof data === 'string' ? data : JSON.stringify(data);
        this.importService.import(json);
      },
      list: () => {
        const tasks = this.store.data().tasks.filter((t) => t.status !== 'done');
        console.table(tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, urgency: t.urgency, dueDate: t.dueDate })));
      },
      today: () => {
        const tasks = this.store.todayTasks();
        console.table(tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, urgency: t.urgency, dueDate: t.dueDate })));
      },
      export: () => {
        return JSON.stringify(this.store.data(), null, 2);
      },
      clear: () => {
        if (confirm('Apagar TODOS os dados?')) {
          this.store.clearAll();
          console.log('[foco] Dados apagados.');
        }
      },
    };

    window.foco = api;
  }
}
