import { afterNextRender, Component, HostListener, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FocusService } from '../../core/focus.service';
import { DataStore } from '../../core/data.store';
import { Task } from '../../core/models';
import { AppIconComponent } from './icon.component';
import { AppButtonComponent } from './button.component';

const STORAGE_KEY = 'foco:focus-widget-pos:v1';

interface WidgetPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-focus-widget',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent, AppButtonComponent],
  templateUrl: './focus-widget.component.html',
})
export class FocusWidgetComponent implements OnInit {
  private readonly focus = inject(FocusService);
  readonly store = inject(DataStore);

  readonly position = signal<WidgetPosition>(this.readPosition());

  dragging = signal(false);
  offset = { x: 0, y: 0 };

  /** Em modo API o widget segue o timer do servidor (apenas quando está a correr). */
  readonly apiMode = computed(() => this.store.useApi);
  readonly active = computed(() => (this.apiMode() ? this.store.activeTimerTask() !== null : this.focus.widgetVisible()));
  readonly timerTask = computed<Task | null>(() => (this.apiMode() ? this.store.activeTimerTask() : null));
  readonly paused = computed(() => {
    if (this.apiMode()) return this.timerTask()?.timer?.state === 'paused';
    return this.focus.paused();
  });
  readonly tick = computed(() => (this.apiMode() ? this.store.activeTimerSeconds() : this.focus.tick()));

  constructor() {
    afterNextRender(() => this.clampPosition());
  }

  ngOnInit(): void {
    this.clampPosition();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.clampPosition();
  }

  formatTick(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  taskTitle(): string | undefined {
    const apiTask = this.timerTask();
    if (apiTask) return apiTask.title;
    const session = this.focus.session();
    if (!session) return undefined;
    return this.store.data().tasks.find((t) => t.id === session.taskId)?.title;
  }

  taskId(): string | undefined {
    return this.timerTask()?.id ?? this.focus.session()?.taskId;
  }

  async pause(): Promise<void> {
    const task = this.timerTask();
    if (task) await this.store.pauseTaskTimer(task.id);
    else this.focus.pause();
  }

  async resume(): Promise<void> {
    const task = this.timerTask();
    if (task) await this.store.resumeTaskTimer(task.id);
    else this.focus.resume();
  }

  async stop(): Promise<void> {
    // Em modo API não existe "parar": pausar fecha a contagem e o widget
    // deixa de mostrar (a retoma é feita no detalhe da tarefa).
    const task = this.timerTask();
    if (task) await this.store.pauseTaskTimer(task.id);
    else this.focus.stop();
  }

  onPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement;
    const interactive = target.closest('button, a, input, select, textarea, [role="button"]');
    if (interactive) {
      return;
    }
    this.dragging.set(true);
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    el.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    const x = event.clientX - this.offset.x;
    const y = event.clientY - this.offset.y;
    this.position.set({ x, y });
    this.clampPosition();
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const el = event.currentTarget as HTMLElement;
    try {
      el.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
    this.persistPosition();
  }

  private readPosition(): WidgetPosition {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.defaultPosition();
      const parsed = JSON.parse(raw) as WidgetPosition;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return this.clamp(parsed);
      }
    } catch {
      // ignore
    }
    return this.defaultPosition();
  }

  private defaultPosition(): WidgetPosition {
    if (typeof window === 'undefined') return { x: 12, y: 12 };
    const compact = window.innerWidth < 1024;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const width = Math.min(viewportWidth - 24, compact ? 280 : 360);
    const height = compact ? 88 : 140;
    const bottomOffset = compact ? 96 : 24;
    return {
      x: Math.max(12, viewportWidth - width - 12),
      y: Math.max(12, window.innerHeight - height - bottomOffset),
    };
  }

  private clampPosition(): void {
    this.position.update((position) => this.clamp(position));
  }

  private clamp(position: WidgetPosition): WidgetPosition {
    if (typeof window === 'undefined') return position;
    const compact = window.innerWidth < 1024;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const width = Math.min(viewportWidth - 24, compact ? 280 : 360);
    const height = compact ? 88 : 140;
    const bottomOffset = compact ? 96 : 24;
    return {
      x: Math.min(Math.max(12, position.x), Math.max(12, viewportWidth - width - 12)),
      y: Math.min(Math.max(12, position.y), Math.max(12, window.innerHeight - height - bottomOffset)),
    };
  }

  private persistPosition(): void {
    try {
      const pos = this.position();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: pos.x, y: pos.y }));
    } catch {
      // ignore
    }
  }
}
