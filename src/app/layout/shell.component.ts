import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { ModalComponent } from '../shared/ui/modal.component';
import { TaskFormComponent } from '../shared/ui/task-form.component';
import { ConfirmDialogComponent } from '../shared/ui/confirm-dialog.component';
import { FocusWidgetComponent } from '../shared/ui/focus-widget.component';
import { ToastComponent } from '../shared/ui/toast.component';
import { OnboardingComponent } from '../shared/ui/onboarding.component';
import { TaskModalService } from '../core/task-modal.service';
import { ConfirmService } from '../core/confirm.service';
import { DataStore } from '../core/data.store';
import { Task } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ModalComponent, TaskFormComponent, ConfirmDialogComponent, FocusWidgetComponent, ToastComponent, OnboardingComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private modal = inject(TaskModalService);
  private confirm = inject(ConfirmService);
  private store = inject(DataStore);
  initialDueDate = this.modal.dueDate;

  closeModal(): void {
    this.modal.hide();
  }

  async onTaskSubmit(patch: Partial<Task>): Promise<void> {
    if (!patch.title || patch.title.trim().length < 2) return;
    const created = await this.store.addTask({
      title: patch.title.trim(),
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
    if (!created) return;
    this.modal.dueDate.set(null);
    this.closeModal();
  }
}