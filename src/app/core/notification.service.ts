import { Injectable, signal, computed, effect } from '@angular/core';
import { AppNotification } from './models';

const STORAGE_KEY = 'foco:notifications:v1';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<AppNotification[]>(this.seed().concat(this.read()));

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
      } catch {
        // ignore
      }
    });
  }

  markAllRead(): void {
    this._items.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  markRead(id: string): void {
    this._items.update((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)));
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
