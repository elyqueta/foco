import { Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { ModalComponent } from '../shared/ui/modal.component';
import { TaskFormComponent } from '../shared/ui/task-form.component';
import { ConfirmDialogComponent } from '../shared/ui/confirm-dialog.component';
import { TaskModalService } from '../core/task-modal.service';
import { ConfirmService } from '../core/confirm.service';
import { DataStore } from '../core/data.store';
import { FocusService } from '../core/focus.service';
import { Task } from '../core/models';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SidebarComponent, TopbarComponent, ModalComponent, TaskFormComponent, ConfirmDialogComponent, LucideAngularModule],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private modal = inject(TaskModalService);
  private confirm = inject(ConfirmService);
  private store = inject(DataStore);
  private focus = inject(FocusService);
  initialDueDate = this.modal.dueDate;

  readonly focusActive = this.focus.active;
  readonly focusPaused = this.focus.paused;
  readonly focusTick = this.focus.tick;

  focusTask(): Task | undefined {
    const session = this.focus.session();
    if (!session) return undefined;
    return this.store.data().tasks.find((t) => t.id === session.taskId) ?? undefined;
  }

  closeModal(): void {
    this.modal.hide();
  }

  onTaskSubmit(patch: Partial<Task>): void {
    this.store.addTask({
      title: patch.title ?? '',
      description: patch.description ?? '',
      category: patch.category ?? 'professional',
      urgency: patch.urgency ?? 'medium',
      status: patch.status ?? 'todo',
      canPostpone: patch.canPostpone ?? true,
      dueDate: patch.dueDate ?? this.modal.dueDate() ?? null,
      nextStep: patch.nextStep ?? '',
      estimateMinutes: patch.estimateMinutes ?? null,
      tags: patch.tags ?? [],
      projectId: patch.projectId ?? null,
    });
    this.modal.dueDate.set(null);
    this.closeModal();
  }

  formatTick(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  pauseFocus(): void {
    this.focus.pause();
  }

  resumeFocus(): void {
    this.focus.resume();
  }

  stopFocus(): void {
    this.focus.stop();
  }
}