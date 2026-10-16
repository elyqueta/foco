import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { ApiError, ApiService } from './api.service';
import { mapNotification } from './notification.utils';
import { AppNotification } from './models';

const STORAGE_KEY = 'foco:notifications:v1';
/** Notificações pedidas por página (a API aceita até 100). */
const PAGE_SIZE = 50;
/** Intervalo de atualização do badge em modo API. */
const POLL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);
  /** Em modo API as notificações vêm do servidor; localmente, de exemplo. */
  readonly useApi = environment.useApi;

  private readonly _items = signal<AppNotification[]>(this.useApi ? [] : this.seed().concat(this.read()));
  private readonly _unreadCount = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadingMore = signal(false);
  private readonly _hasMore = signal(false);
  private readonly _error = signal<string | null>(null);
  private cursor: string | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();
  readonly error = this._error.asReadonly();

  /** Não lidas: contador do servidor em modo API, lista local nos outros casos. */
  readonly unreadCount = computed(() => (this.useApi ? this._unreadCount() : this._items().filter((n) => !n.read).length));

  constructor() {
    if (!this.useApi) {
      effect(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
        } catch {
          // ignore
        }
      });
    }
  }

  /** Primeira carga ligada ao servidor + atualização periódica do badge (modo API). */
  async bootstrap(): Promise<void> {
    if (!this.useApi) return;
    await this.refresh();
    this.startPolling();
  }

  /** Recarrega a primeira página e o contador de não lidas. */
  async refresh(): Promise<void> {
    if (!this.useApi) return;
    this.cursor = null;
    this._loading.set(true);
    this._error.set(null);
    try {
      const [notifications, count] = await Promise.all([
        this.api.listNotifications({ limit: PAGE_SIZE }),
        this.api.unreadNotificationCount(),
      ]);
      this.cursor = notifications.at(-1)?.id ?? null;
      this._hasMore.set(notifications.length >= PAGE_SIZE);
      this._items.set(notifications.map(mapNotification));
      this._unreadCount.set(count);
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
    } finally {
      this._loading.set(false);
    }
  }

  /** Página anterior (`before`), acumulada na lista. */
  async loadMore(): Promise<void> {
    if (!this.useApi || this._loadingMore() || !this.cursor) return;
    this._loadingMore.set(true);
    try {
      const notifications = await this.api.listNotifications({ limit: PAGE_SIZE, before: this.cursor });
      this.cursor = notifications.at(-1)?.id ?? null;
      this._hasMore.set(notifications.length >= PAGE_SIZE);
      const mapped = notifications.map(mapNotification);
      const known = new Set(this._items().map((n) => n.id));
      this._items.update((items) => [...items, ...mapped.filter((n) => !known.has(n.id))]);
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
    } finally {
      this._loadingMore.set(false);
    }
  }

  async markRead(id: string): Promise<void> {
    const item = this._items().find((n) => n.id === id);
    if (!item || item.read) return;
    this._items.update((items) => items.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!this.useApi) return;
    this._unreadCount.update((count) => Math.max(0, count - 1));
    try {
      await this.api.markNotificationRead(id);
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
    }
  }

  async markAllRead(): Promise<void> {
    this._items.update((items) => items.map((n) => ({ ...n, read: true })));
    this._unreadCount.set(0);
    if (!this.useApi) return;
    try {
      await this.api.markAllNotificationsRead();
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
      void this.refresh();
    }
  }

  async remove(id: string): Promise<void> {
    const item = this._items().find((n) => n.id === id);
    this._items.update((items) => items.filter((n) => n.id !== id));
    if (!this.useApi) return;
    if (item && !item.read) {
      this._unreadCount.update((count) => Math.max(0, count - 1));
    }
    try {
      await this.api.deleteNotification(id);
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
      void this.refresh();
    }
  }

  async clear(): Promise<void> {
    this._items.set([]);
    this._unreadCount.set(0);
    this.cursor = null;
    this._hasMore.set(false);
    if (!this.useApi) return;
    try {
      await this.api.clearNotifications();
    } catch (error: unknown) {
      this._error.set(this.toMessage(error));
      void this.refresh();
    }
  }

  /** Limpa o estado e para a atualização periódica (logout). */
  reset(): void {
    this.stopPolling();
    this._error.set(null);
    this.cursor = null;
    // Notificações locais são do dispositivo, não do utilizador.
    if (!this.useApi) return;
    this._items.set([]);
    this._unreadCount.set(0);
    this._hasMore.set(false);
  }

  private startPolling(): void {
    if (this.poll) return;
    this.poll = setInterval(() => void this.refresh(), POLL_MS);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  private stopPolling(): void {
    if (this.poll) {
      clearInterval(this.poll);
      this.poll = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /** Ao voltar ao separador, atualiza a lista e o badge. */
  private onVisibility = (): void => {
    if (document.visibilityState === 'visible') void this.refresh();
  };

  private toMessage(error: unknown): string {
    return error instanceof ApiError ? error.message : 'Não foi possível carregar as notificações.';
  }

  private read(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AppNotification[];
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  private seed(): AppNotification[] {
    const now = new Date().toISOString();
    return [
      {
        id: crypto.randomUUID(),
        title: 'Sessão iniciada',
        message: 'Começaste o modo foco na tarefa "Revisar proposta do projeto X".',
        type: 'focus',
        read: false,
        createdAt: new Date(new Date(now).getTime() - 1000 * 60 * 3).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Tarefa concluída',
        message: 'A tarefa "Enviar relatório semanal" foi marcada como concluída.',
        type: 'success',
        read: false,
        createdAt: new Date(new Date(now).getTime() - 1000 * 60 * 45).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Lembrete de prazo',
        message: 'A tarefa "Preparar apresentação" vence hoje às 18:00.',
        type: 'warning',
        read: true,
        createdAt: new Date(new Date(now).getTime() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: crypto.randomUUID(),
        title: 'Novo comentário',
        message: 'O João comentou na tarefa "Revisar orçamento".',
        type: 'info',
        read: true,
        createdAt: new Date(new Date(now).getTime() - 1000 * 60 * 60 * 5).toISOString(),
      },
    ];
  }
}
