import { afterNextRender, Component, HostListener, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FocusService } from '../../core/focus.service';
import { DataStore } from '../../core/data.store';
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
  private readonly store = inject(DataStore);

  readonly active = this.focus.widgetVisible;
  readonly paused = this.focus.paused;
  readonly tick = this.focus.tick;

  readonly position = signal<WidgetPosition>(this.readPosition());

  dragging = signal(false);
  offset = { x: 0, y: 0 };

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
    const session = this.focus.session();
    if (!session) return undefined;
    return this.store.data().tasks.find((t) => t.id === session.taskId)?.title;
  }

  taskId(): string | undefined {
    return this.focus.session()?.taskId;
  }

  pause(): void { this.focus.pause(); }
  resume(): void { this.focus.resume(); }
  stop(): void { this.focus.stop(); }

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
