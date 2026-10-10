import { Injectable } from '@angular/core';
import { AppData, Task } from './models';

const STORAGE_KEY = 'foco:data:v1';
const TASKS_STORAGE_KEY = 'foco:tasks:v1';
const TASKS_MIGRATION_KEY = `${TASKS_STORAGE_KEY}:migrated`;

export const DEFAULT_CATEGORIES = ['professional', 'personal', 'household'];

export abstract class DataRepository {
  abstract load(): AppData;
  abstract save(data: AppData): void;
  /** Dados locais ainda não sincronizados (tarefas migradas de versões antigas). */
  pendingTasks?(): Task[];
  /** Remove a cache local de tarefas (depois de migradas para a API). */
  clearTasks?(): void;
}

interface StoredLocal {
  schemaVersion?: number;
  tasks?: Task[];
  settings?: AppData['settings'];
}

export function emptyAppData(): AppData {
  return {
    schemaVersion: 1,
    projects: [],
    tasks: [],
    settings: { theme: 'light', userName: 'Zua', colorScheme: 'purple' },
    categories: [...DEFAULT_CATEGORIES],
  };
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

@Injectable({ providedIn: 'root' })
export class LocalStorageRepository extends DataRepository {
  load(): AppData {
    const parsed = readJson(STORAGE_KEY) as AppData | null;
    if (!parsed || parsed.schemaVersion !== 1) return emptyAppData();
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      parsed.categories = [...DEFAULT_CATEGORIES];
    }
    return parsed;
  }

  save(data: AppData): void {
    writeJson(STORAGE_KEY, data);
  }
}

/**
 * Repositório usado quando a app está em modo API. Projetos, categorias e
 * tarefas vivem no servidor; localmente ficam apenas as preferências. Tarefas
 * de armazenamentos antigos são migradas uma única vez para a API (ver
 * `pendingTasks`/`clearTasks`) e depois removidas da cache local.
 */
@Injectable({ providedIn: 'root' })
export class LocalTasksRepository extends DataRepository {
  private scope: string | null = null;

  setScope(userId: string | number | null | undefined): void {
    this.scope = userId === null || userId === undefined ? null : String(userId);
  }

  private get key(): string {
    return this.scope ? `${TASKS_STORAGE_KEY}:${this.scope}` : TASKS_STORAGE_KEY;
  }

  load(): AppData {
    const own = readJson(this.key) as StoredLocal | null;
    if (own && own.schemaVersion === 1) {
      return {
        ...emptyAppData(),
        tasks: [],
        settings: own.settings ?? emptyAppData().settings,
      };
    }
    if (this.scope && readJson(TASKS_MIGRATION_KEY) === null) {
      const legacy = readJson(STORAGE_KEY) as StoredLocal | null;
      if (legacy && legacy.schemaVersion === 1) {
        this.write({ tasks: Array.isArray(legacy.tasks) ? legacy.tasks : [], settings: legacy.settings ?? emptyAppData().settings });
        writeJson(TASKS_MIGRATION_KEY, { schemaVersion: 1 });
        return {
          ...emptyAppData(),
          tasks: [],
          settings: legacy.settings ?? emptyAppData().settings,
        };
      }
      writeJson(TASKS_MIGRATION_KEY, { schemaVersion: 1 });
    }
    return emptyAppData();
  }

  save(data: AppData): void {
    // Preserva `tasks` (carga de migração legacy) — só as preferências são locais.
    const own = (readJson(this.key) as StoredLocal | null) ?? { schemaVersion: 1 };
    this.write({ ...own, settings: data.settings });
  }

  override pendingTasks(): Task[] {
    const own = readJson(this.key) as StoredLocal | null;
    return Array.isArray(own?.tasks) ? own.tasks : [];
  }

  override clearTasks(): void {
    const own = (readJson(this.key) as StoredLocal | null) ?? { schemaVersion: 1 };
    this.write({ ...own, tasks: [] });
  }

  private write(value: StoredLocal): void {
    writeJson(this.key, { schemaVersion: 1, ...value });
  }
}
