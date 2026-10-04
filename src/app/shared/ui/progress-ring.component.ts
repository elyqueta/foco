import { Component, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <svg class="h-[44px] w-[44px]" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="4" class="stroke-surface-line" />
      <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="4" stroke-linecap="round" [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="offset" [class.stroke-success]="percent() >= 60" [class.stroke-brand]="percent() < 60" [class.stroke-danger]="isOverdue()" class="-rotate-90 origin-center" />
      <text x="18" y="18" text-anchor="middle" dy=".35em" class="text-[10px] font-bold fill-ink">{{ percent() }}%</text>
    </svg>
  `,
})
export class ProgressRingComponent {
  percent = input.required<number>();
  isOverdue = input(false);

  circumference = 2 * Math.PI * 15.5;

  offset(): number {
    return this.circumference - (this.percent() / 100) * this.circumference;
  }
}
