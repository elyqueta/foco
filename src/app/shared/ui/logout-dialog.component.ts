import { Component, output } from '@angular/core';
import { AppIconComponent } from './icon.component';
import { AppButtonComponent } from './button.component';

@Component({
  selector: 'app-logout-dialog',
  standalone: true,
  imports: [AppIconComponent, AppButtonComponent],
  template: `
    <div class="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" (click)="cancel.emit()">
      <div class="w-full max-w-[400px] rounded-card bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <div class="flex flex-col items-center text-center gap-3">
          <div class="grid h-12 w-12 place-items-center rounded-full bg-danger-soft">
            <app-icon name="log-out" [size]="20" class="text-danger" />
          </div>

          <h2 class="text-[18px] font-bold text-ink">Terminar sessão</h2>
          <p class="text-[13px] text-ink-500">Escolhe onde queres terminar a sessão. Podes sair apenas deste dispositivo ou de todos os dispositivos com sessão iniciada.</p>
        </div>

        <div class="mt-6 flex flex-col gap-3">
          <app-button variant="primary" icon="smartphone" label="Terminar sessão neste dispositivo" [iconOnlyBelow]="null" buttonClass="w-full" (click)="logoutThisDevice.emit()"></app-button>
          <app-button variant="danger" icon="users" label="Terminar sessão em todos os dispositivos" [iconOnlyBelow]="null" buttonClass="w-full" (click)="logoutAllDevices.emit()"></app-button>
          <app-button variant="ghost" icon="x" label="Cancelar" [iconOnlyBelow]="null" buttonClass="w-full" (click)="cancel.emit()"></app-button>
        </div>
      </div>
    </div>
  `,
})
export class LogoutDialogComponent {
  logoutThisDevice = output<void>();
  logoutAllDevices = output<void>();
  cancel = output<void>();
}
