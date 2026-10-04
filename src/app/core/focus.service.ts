import { Injectable, signal, computed, effect } from '@angular/core';
import { Task } from './models';

export interface FocusSession {
  taskId: string;
  startedAt: string;
  durationMs: number;
}

const STORAGE_KEY = 'foco:focus:v1';

@Injectable({ providedIn: 'root' })
export class FocusService {
  private readonly _session = signal<FocusSession | null>(this.read());
  private _tick = signal(0);

  readonly session = this._session.asReadonly();

  readonly tick = computed(() => {
    const s = this._session();
    if (!s) return 0;
    return Math.max(0, Math.floor((s.durationMs - (Date.now() - new Date(s.startedAt).getTime())) / 1000));
  });

  readonly active = computed(() => !!this._session() && this.tick() > 0);

  start(task: Task, minutes?: number): void {
    const durationMs = minutes ? minutes * 60 * 1000 : (task.estimateMinutes ? task.estimateMinutes * 60 * 1000 : 25 * 60 * 1000);
    const session: FocusSession = {
      taskId: task.id,
      startedAt: new Date().toISOString(),
      durationMs,
    };
    this._session.set(session);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  stop(): void {
    this._session.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private read(): FocusSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as FocusSession;
      if (!parsed?.taskId || !parsed?.startedAt || typeof parsed.durationMs !== 'number') return null;
      if (Date.now() - new Date(parsed.startedAt).getTime() > parsed.durationMs) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
}
