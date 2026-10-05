import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService } from '../../core/export.service';
import { AppIconComponent } from './icon.component';
import { AppButtonComponent } from './button.component';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AppButtonComponent],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" (click)="close.emit()">
      <div class="w-full max-w-[420px] rounded-2xl border border-surface-line bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <h2 class="text-[18px] font-bold text-ink">Exportar dados</h2>
        <p class="mt-1 text-[12px] text-ink-500">Escolhe o formato da exportação.</p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button type="button" aria-label="Exportar como JSON" (click)="choose('json')" class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-line bg-surface-app p-5 transition hover:border-brand hover:bg-brand-50">
            <span class="grid h-12 w-12 place-items-center rounded-xl bg-surface-card text-ink shadow-card">
              <app-icon name="file-json" [size]="20" />
            </span>
            <span class="text-[13px] font-semibold text-ink">JSON</span>
            <span class="text-[11px] text-ink-500">Ficheiro de backup</span>
          </button>

          <button type="button" aria-label="Exportar como PDF" (click)="choose('pdf')" class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-line bg-surface-app p-5 transition hover:border-brand hover:bg-brand-50">
            <span class="grid h-12 w-12 place-items-center rounded-xl bg-surface-card text-ink shadow-card">
              <app-icon name="file-text" [size]="20" />
            </span>
            <span class="text-[13px] font-semibold text-ink">PDF</span>
            <span class="text-[11px] text-ink-500">Relatório formatado</span>
          </button>
        </div>

        <app-button variant="secondary" icon="x" label="Cancelar" [iconOnlyBelow]="null" buttonClass="mt-6 w-full" (click)="close.emit()"></app-button>
      </div>
    </div>
  `,
})
export class ExportDialogComponent {
  private readonly exportService = inject(ExportService);

  close = output<void>();

  choose(format: 'json' | 'pdf'): void {
    if (format === 'json') {
      this.exportService.exportJson();
    } else {
      this.exportService.exportPdf();
    }
    this.close.emit();
  }
}
