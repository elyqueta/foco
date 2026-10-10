import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiActivityEntry,
  ApiAuthUser,
  ApiCategory,
  ApiProject,
  ApiProjectFilters,
  ApiProjectInput,
  ApiSettings,
  ApiSettingsInput,
  ApiTask,
  ApiTaskActionResult,
  ApiTaskInput,
  ApiTaskListFilters,
} from './api.models';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isNoChanges(): boolean {
    return this.status === 422 && this.code === 'NO_CHANGES';
  }
}

interface ApiErrorBody {
  message?: string;
  code?: string;
}

function toApiError(error: unknown): ApiError {
  const status = error && typeof error === 'object' && 'status' in error ? (error as { status: number }).status : 0;
  const body = error && typeof error === 'object' && 'error' in error ? (error as { error?: unknown }).error : undefined;
  const payload = (body ?? {}) as ApiErrorBody;
  const fallback: Record<number, string> = {
    0: 'Não foi possível contactar o servidor.',
    400: 'Pedido inválido.',
    401: 'Sessão expirada. Entra novamente.',
    403: 'Sem permissão.',
    404: 'Não encontrado.',
    405: 'Método não permitido.',
    422: 'Não foi possível concluir o pedido.',
    429: 'Demasiadas tentativas. Tenta novamente dentro de instantes.',
    503: 'Serviço indisponível.',
  };
  const message = typeof payload.message === 'string' && payload.message ? payload.message : fallback[status] ?? 'Ocorreu um erro. Tenta novamente.';
  const code = typeof payload.code === 'string' ? payload.code : null;
  return new ApiError(message, status, code);
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  private async request<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error: unknown) {
      throw toApiError(error);
    }
  }

  private get<T>(path: string, params?: Record<string, string>): Promise<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value) {
          httpParams = httpParams.set(key, value);
        }
      }
    }
    return this.request(() => firstValueFrom(this.http.get<T>(`${this.base}${path}`, { params: httpParams })));
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request(() => firstValueFrom(this.http.post<T>(`${this.base}${path}`, body ?? {})));
  }

  private patch<T>(path: string, body: unknown): Promise<T> {
    return this.request(() => firstValueFrom(this.http.patch<T>(`${this.base}${path}`, body ?? {})));
  }

  private delete<T>(path: string): Promise<T> {
    return this.request(() => firstValueFrom(this.http.delete<T>(`${this.base}${path}`)));
  }

  // ---------- Auth ----------

  login(email: string, password: string): Promise<{ token: string; user: ApiAuthUser; expires_at: string | null }> {
    return this.post('/auth/login', { email, password });
  }

  register(input: { name: string; email: string; password: string; passwordConfirmation: string }): Promise<{ token: string; user: ApiAuthUser; expires_at: string | null }> {
    return this.post('/auth/register', input);
  }

  logout(): Promise<void> {
    return this.post('/auth/logout', {}).then(() => undefined);
  }

  logoutAll(): Promise<void> {
    return this.post('/auth/logout-all', {}).then(() => undefined);
  }

  me(): Promise<ApiAuthUser> {
    return this.get('/auth/me');
  }

  changePassword(currentPassword: string, password: string, passwordConfirmation: string): Promise<void> {
    return this.patch('/auth/password', { currentPassword, password, passwordConfirmation }).then(() => undefined);
  }

  updateProfile(input: { name?: string; email?: string; currentPassword?: string }): Promise<void> {
    return this.patch('/auth/profile', input).then(() => undefined);
  }

  // ---------- Settings ----------

  getSettings(): Promise<ApiSettings> {
    return this.get('/settings');
  }

  updateSettings(input: ApiSettingsInput): Promise<ApiSettings> {
    return this.patch('/settings', input);
  }

  // ---------- Categories ----------

  listCategories(): Promise<ApiCategory[]> {
    return this.get('/categories');
  }

  createCategory(name: string): Promise<ApiCategory> {
    return this.post('/categories', { name });
  }

  deleteCategory(name: string): Promise<void> {
    return this.delete(`/categories/${encodeURIComponent(name)}`).then(() => undefined);
  }

  // ---------- Projects ----------

  listProjects(filters: ApiProjectFilters = {}): Promise<ApiProject[]> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string' && value) {
        params[key] = value;
      }
    }
    return this.get('/projects', params);
  }

  getProject(id: string): Promise<ApiProject> {
    return this.get(`/projects/${id}`);
  }

  createProject(input: ApiProjectInput): Promise<ApiProject> {
    return this.post('/projects', input);
  }

  updateProject(id: string, input: ApiProjectInput): Promise<ApiProject> {
    return this.patch(`/projects/${id}`, input);
  }

  deleteProject(id: string): Promise<void> {
    return this.delete(`/projects/${id}`).then(() => undefined);
  }

  addProjectNote(id: string, text: string): Promise<ApiActivityEntry> {
    return this.post(`/projects/${id}/notes`, { text });
  }

  // ---------- Tasks ----------

  listTasks(filters: ApiTaskListFilters = {}): Promise<ApiTask[]> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue;
      if (typeof value === 'boolean') {
        params[key] = value ? 'true' : 'false';
      } else {
        params[key] = String(value);
      }
    }
    return this.get('/tasks', params);
  }

  getTask(id: string): Promise<ApiTask> {
    return this.get(`/tasks/${id}`);
  }

  createTask(input: ApiTaskInput): Promise<ApiTask> {
    return this.post('/tasks', input);
  }

  updateTask(id: string, input: ApiTaskInput): Promise<ApiTask> {
    return this.patch(`/tasks/${id}`, input);
  }

  deleteTask(id: string): Promise<void> {
    return this.delete(`/tasks/${id}`).then(() => undefined);
  }

  completeTask(id: string): Promise<ApiTaskActionResult> {
    return this.post(`/tasks/${id}/complete`, {});
  }

  reopenTask(id: string): Promise<ApiTaskActionResult> {
    return this.post(`/tasks/${id}/reopen`, {});
  }

  postponeTask(id: string, dueDate: string): Promise<ApiTaskActionResult> {
    return this.post(`/tasks/${id}/postpone`, { dueDate });
  }

  addTaskNote(id: string, text: string): Promise<ApiActivityEntry> {
    return this.post(`/tasks/${id}/notes`, { text });
  }
}
