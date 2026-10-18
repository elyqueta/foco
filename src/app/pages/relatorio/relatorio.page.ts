import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RelatorioService } from '../../core/relatorio/relatorio.service';
import { RelatorioPdfService } from '../../core/relatorio/relatorio-pdf.service';
import { ReportPeriodOption, ReportRequestParams } from '../../core/relatorio/relatorio.models';
import { AppButtonComponent } from '../../shared/ui/button.component';

const PERIOD_OPTIONS: ReportPeriodOption[] = [
  { value: 'today', label: 'Hoje', needsDates: false, needsMonth: false },
  { value: 'this_week', label: 'Esta semana', needsDates: false, needsMonth: false },
  { value: 'last_week', label: 'Semana passada', needsDates: false, needsMonth: false },
  { value: 'this_month', label: 'Este mês', needsDates: false, needsMonth: true },
  { value: 'last_month', label: 'Mês passado', needsDates: false, needsMonth: true },
  { value: 'custom', label: 'Intervalo personalizado', needsDates: true, needsMonth: false },
];

@Component({
  selector: 'app-relatorio-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppButtonComponent],
  template: `
    <div class="mt-4 w-full min-w-0 sm:mt-8 sm:max-w-[720px]">
      <h1 class="mb-5 text-[26px] font-extrabold text-ink sm:mb-6 sm:text-[28px]">Relatório de Produtividade</h1>
      <p class="mb-6 text-[13px] leading-relaxed text-ink-500">Gere um PDF com a visão geral dos teus projetos e tarefas. Escolhe o período e exporta.</p>

      <div class="rounded-card bg-surface-card p-5 shadow-card sm:p-6">
        <h3 class="mb-4 text-[16px] font-bold text-ink sm:mb-5">Escolhe o período</h3>

        <div class="space-y-3">
          @for (opt of periodOptions; track opt.value) {
            <label class="flex items-center gap-3 rounded-xl border border-surface-line bg-surface-card p-3 cursor-pointer select-none group"
              [class.border-brand/30]="selectedPeriod() === opt.value"
              [class.bg-brand-50]="selectedPeriod() === opt.value">
              <input type="radio" name="period" [value]="opt.value" [ngModel]="selectedPeriod()"
                (ngModelChange)="selectedPeriod.set($event)"
                class="h-5 w-5 rounded border border-surface-line text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
              <span class="text-[13px] font-semibold text-ink">{{ opt.label }}</span>
            </label>
          }
        </div>

        <!-- Campo de mês (este mês / mês passado) -->
        @if (needsMonth()) {
          <div class="mt-2">
            <label for="month" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Mês</label>
            <input id="month" type="month" [(ngModel)]="monthValue"
              class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
        }

        <!-- Campos de data personalizada -->
        @if (needsDates()) {
          <div class="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label for="startDate" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Data de início</label>
              <input id="startDate" type="date" [(ngModel)]="startDate"
                class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
            <div>
              <label for="endDate" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Data de fim</label>
              <input id="endDate" type="date" [(ngModel)]="endDate"
                class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/30" />
            </div>
          </div>
        }

        <!-- Botão exportar -->
        <div class="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <app-button
            icon="download"
            [label]="exporting() ? 'A gerar PDF…' : 'Exportar PDF'"
            [loading]="exporting()"
            [disabled]="exporting() || !canExport()"
            buttonClass="w-full sm:w-auto"
            (click)="exportPdf()"
          ></app-button>
        </div>

        <!-- Erro -->
        @if (error()) {
          <p class="mt-3 text-[12px] text-danger">{{ error() }}</p>
        }
      </div>
    </div>
  `,
})
export class RelatorioPage {
  private relatorio = inject(RelatorioService);
  private pdf = inject(RelatorioPdfService);
  private router = inject(Router);

  readonly periodOptions = PERIOD_OPTIONS;
  selectedPeriod = signal(PERIOD_OPTIONS[0].value);
  monthValue = '';
  startDate = '';
  endDate = '';

  exporting = signal(false);
  error = signal('');

  needsMonth = computed(() => PERIOD_OPTIONS.find((o) => o.value === this.selectedPeriod())?.needsMonth ?? false);
  needsDates = computed(() => PERIOD_OPTIONS.find((o) => o.value === this.selectedPeriod())?.needsDates ?? false);

  canExport(): boolean {
    if (this.exporting()) return false;
    if (this.needsDates()) {
      return Boolean(this.startDate && this.endDate);
    }
    return true;
  }

  async exportPdf(): Promise<void> {
    if (!this.canExport()) return;
    this.error.set('');
    this.exporting.set(true);

    try {
      const params: ReportRequestParams = { period: this.selectedPeriod() };
      if (this.needsMonth() && this.monthValue) {
        params.month = this.monthValue.slice(0, 7); // YYYY-MM
      }
      if (this.needsDates()) {
        params.start_date = this.startDate;
        params.end_date = this.endDate;
      }

      const report = await this.relatorio.getProductivityReport(params);
      await this.pdf.exportPdf(report);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        // O interceptor já limpa a sessão e redireciona para /login
        this.router.navigate(['/login']);
        return;
      }
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Não foi possível gerar o relatório.';
      this.error.set(String(msg));
    } finally {
      this.exporting.set(false);
    }
  }
}
