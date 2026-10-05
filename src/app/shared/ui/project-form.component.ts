import { Component, EventEmitter, Input, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, Category, Urgency } from '../../core/models';
import { DataStore } from '../../core/data.store';
import { AppButtonComponent } from './button.component';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent],
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent {
  @Input() project?: Partial<Project>;
  @Output() submit = new EventEmitter<Partial<Project>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<Partial<Project>>({});
  touched = signal(false);
  private store = inject(DataStore);

  categoryOptions(): string[] {
    return this.store.categories();
  }
}