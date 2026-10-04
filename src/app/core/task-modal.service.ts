import { Injectable, signal, effect } from '@angular/core';
import { TaskFormComponent } from '../shared/ui/task-form.component';

@Injectable({ providedIn: 'root' })
export class TaskModalService {
  open = signal(false);
  dueDate = signal<string | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) {
        this.dueDate.set(null);
      }
    });
  }

  show(dueDate?: string | null): void {
    if (dueDate) {
      this.dueDate.set(dueDate);
    }
    this.open.set(true);
  }

  hide(): void {
    this.open.set(false);
  }
}