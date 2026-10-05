import { Injectable, signal, computed, effect } from '@angular/core';
import { AppNotification } from './models';

const STORAGE_KEY = 'foco:notifications:v1';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _items = signal<AppNotification[]>(this.read());

  readonly items = this._items.asReadonly();
  readonly unreadCount = computed(() => this._items().filter((n) => !n.read).length);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items().slice(0, 50)));
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

  add(item: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    const notification: AppNotification = {
      ...item,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this._items.update((items) => [notification, ...items].slice(0, 50));
  }

  private read(): AppNotification[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.seed();
      const parsed = JSON.parse(raw) as AppNotification[];
      if (!Array.isArray(parsed)) return this.seed();
      return parsed;
    } catch {
      return this.seed();
    }
  }

  private seed(): AppNotification[] {
    return [
      {
        id: 'seed-welcome',
        title: 'Bem-vindo ao Foco',
        message: 'Começa por criar uma tarefa ou projeto para organizar o teu dia.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}
