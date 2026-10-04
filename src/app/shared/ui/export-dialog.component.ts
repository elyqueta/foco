import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ExportService } from '../../core/export.service';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" (click)="close.emit()">
      <div class="w-full max-w-[420px] rounded-2xl border border-surface-line bg-surface-card p-6 shadow-float" (click)="$event.stopPropagation()">
        <h2 class="text-[18px] font-bold text-ink">Exportar dados</h2>
        <p class="mt-1 text-[12px] text-ink-500">Escolhe o formato da exportação.</p>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button type="button" (click)="choose('json')" class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-line bg-surface-app p-5 transition hover:border-brand hover:bg-brand-50">
            <span class="grid h-12 w-12 place-items-center rounded-xl bg-surface-card text-ink shadow-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </span>
            <span class="text-[13px] font-semibold text-ink">JSON</span>
            <span class="text-[11px] text-ink-500">Ficheiro de backup</span>
          </button>

          <button type="button" (click)="choose('pdf')" class="flex flex-col items-center justify-center gap-3 rounded-2xl border border-surface-line bg-surface-app p-5 transition hover:border-brand hover:bg-brand-50">
            <span class="grid h-12 w-12 place-items-center rounded-xl bg-surface-card text-ink shadow-card">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            <span class="text-[13px] font-semibold text-ink">PDF</span>
            <span class="text-[11px] text-ink-500">Relatório formatado</span>
          </button>
        </div>

        <button type="button" (click)="close.emit()" class="mt-6 w-full rounded-xl border border-surface-line bg-surface-app py-2.5 text-[13px] font-semibold text-ink transition hover:bg-surface-line">Cancelar</button>
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

