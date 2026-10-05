import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.component.html',
})
export class ProgressRingComponent {
  percent = input.required<number>();
  isOverdue = input(false);

  circumference = 2 * Math.PI * 15.5;
  displayPercent = computed(() => Math.min(100, Math.max(0, this.percent())));

  offset(): number {
    return this.circumference - (this.displayPercent() / 100) * this.circumference;
  }
}
