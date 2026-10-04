import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { ModalComponent } from '../shared/ui/modal.component';
import { TaskFormComponent } from '../shared/ui/task-form.component';
import { TaskModalService } from '../core/task-modal.service';
import { DataStore } from '../core/data.store';
import { Task } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ModalComponent, TaskFormComponent],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  private modal = inject(TaskModalService);
  private store = inject(DataStore);

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
      dueDate: patch.dueDate ?? null,
      nextStep: patch.nextStep ?? '',
      estimateMinutes: patch.estimateMinutes ?? null,
      tags: patch.tags ?? [],
      projectId: null,
    });
    this.closeModal();
  }
}
