import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.component.html',
})
export class ProgressRingComponent {
  percent = input.required<number>();
  isOverdue = input(false);

  circumference = 2 * Math.PI * 15.5;

  offset(): number {
    return this.circumference - (this.percent() / 100) * this.circumference;
  }
}
