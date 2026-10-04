import { Injectable, signal, computed, effect } from '@angular/core';
import { Task } from './models';

export interface FocusSession {
  taskId: string;
  startedAt: string;
  durationMs: number;
  paused: boolean;
  pausedAt: string | null;
}

const STORAGE_KEY = 'foco:focus:v1';

@Injectable({ providedIn: 'root' })
export class FocusService {
  private readonly _session = signal<FocusSession | null>(this.read());
  private readonly _paused = signal(false);

  readonly session = this._session.asReadonly();
  readonly paused = this._paused.asReadonly();

  readonly tick = computed(() => {
    const s = this._session();
    if (!s) return 0;
    if (s.paused || this._paused()) return Math.max(0, Math.floor(s.durationMs / 1000));
    return Math.max(0, Math.floor((s.durationMs - (Date.now() - new Date(s.startedAt).getTime())) / 1000));
  });

  readonly active = computed(() => !!this._session() && this.tick() > 0);

  start(task: Task, minutes?: number): void {
    const durationMs = minutes ? minutes * 60 * 1000 : (task.estimateMinutes ? task.estimateMinutes * 60 * 1000 : 25 * 60 * 1000);
    const session: FocusSession = {
      taskId: task.id,
      startedAt: new Date().toISOString(),
      durationMs,
      paused: false,
      pausedAt: null,
    };
    this._session.set(session);
    this._paused.set(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }
  }

  pause(): void {
    const s = this._session();
    if (!s || s.paused) return;
    const elapsed = Date.now() - new Date(s.startedAt).getTime();
    const remainingMs = Math.max(0, s.durationMs - elapsed);
    const updated: FocusSession = {
      ...s,
      paused: true,
      pausedAt: new Date().toISOString(),
      durationMs: remainingMs,
      startedAt: new Date().toISOString(),
    };
    this._session.set(updated);
    this._paused.set(true);
    this.persist(updated);
  }

  resume(): void {
    const s = this._session();
    if (!s || !s.paused) return;
    const updated: FocusSession = {
      ...s,
      paused: false,
      pausedAt: null,
      startedAt: new Date().toISOString(),
    };
    this._session.set(updated);
    this._paused.set(false);
    this.persist(updated);
  }

  stop(): void {
    this._session.set(null);
    this._paused.set(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private persist(session: FocusSession): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
      if (parsed.paused) {
        return parsed;
      }
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
