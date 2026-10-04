import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Project, Category, Urgency } from '../../core/models';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-form.component.html',
})
export class ProjectFormComponent {
  @Input() project?: Partial<Project>;
  @Output() submit = new EventEmitter<Partial<Project>>();
  @Output() cancel = new EventEmitter<void>();

  form = signal<Partial<Project>>({});
}
