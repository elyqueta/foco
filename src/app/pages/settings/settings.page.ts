import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { emptyAppData } from '../../core/storage.repository';
import { ConfirmService } from '../../core/confirm.service';
import { ThemeService } from '../../core/theme.service';
import { ColorSchemeService, ColorScheme } from '../../core/color-scheme.service';
import { AppThemeToggleComponent } from '../../shared/ui/theme-toggle.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppThemeToggleComponent],
  template: `
    <div class="mt-8 max-w-[720px]">
      <h1 class="text-[28px] font-extrabold text-ink mb-6">Definições</h1>

      <div class="rounded-card bg-surface-card p-5 shadow-card mb-5">
        <h3 class="text-[16px] font-bold text-ink mb-4">Perfil</h3>
        <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">O teu nome</label>
        <input type="text" [(ngModel)]="userName" class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="O teu nome" (ngModelChange)="onUserNameChange($event)" />
      </div>

      <div class="rounded-card bg-surface-card p-5 shadow-card mb-5">
        <h3 class="text-[16px] font-bold text-ink mb-4">Aparência</h3>
        <app-theme-toggle />

        <label class="mt-4 mb-1.5 block text-[12px] font-semibold text-ink-700">Cor principal</label>
        <div class="grid grid-cols-4 gap-3">
          @for (option of colorOptions; track option.key) {
            <button type="button" (click)="setColor(option.key)"
              [class]="'flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 transition ' + (colorScheme() === option.key ? 'border-brand bg-brand-50' : 'border-surface-line bg-surface-app hover:border-brand/50')">
              <span class="h-8 w-8 rounded-full border border-black/5" [style]="'background: ' + option.cssColor"></span>
              <span class="text-[12px] font-semibold text-ink">{{ option.label }}</span>
            </button>
          }
        </div>
      </div>

      <div class="rounded-card bg-surface-card p-5 shadow-card mb-5">
        <h3 class="text-[16px] font-bold text-ink mb-4">Dados</h3>
        <div class="flex flex-col gap-3">
          <button (click)="exportJson()" class="h-10 rounded-xl border border-surface-line bg-surface-card px-5 text-[13px] font-semibold text-ink-500 transition hover:text-ink">Exportar JSON</button>
          <button (click)="restoreSeed()" class="h-10 rounded-xl border border-surface-line bg-surface-card px-5 text-[13px] font-semibold text-ink-500 transition hover:text-ink">Restaurar dados de exemplo</button>
          <button (click)="clearAll()" class="h-10 rounded-xl border border-danger/40 bg-surface-card px-5 text-[13px] font-semibold text-danger transition hover:bg-danger-soft">Apagar tudo</button>
        </div>
      </div>
    </div>
  `,
})
export class SettingsPage {
  private store = inject(DataStore);
  private themeService = inject(ThemeService);
  private confirm = inject(ConfirmService);
  private colorService = inject(ColorSchemeService);
  theme = this.themeService.theme;
  colorScheme = this.colorService.scheme;
  userName = signal(this.store.data().settings.userName);

  colorOptions: { key: ColorScheme; label: string; cssColor: string }[] = [
    { key: 'purple', label: 'Roxo', cssColor: 'rgb(108 92 231)' },
    { key: 'blue', label: 'Azul', cssColor: 'rgb(37 99 235)' },
    { key: 'red', label: 'Vermelho', cssColor: 'rgb(220 38 38)' },
    { key: 'gray', label: 'Cinza', cssColor: 'rgb(75 85 99)' },
  ];

  constructor() {
    effect(() => {
      this.userName.set(this.store.data().settings.userName);
    });
  }

  setTheme(value: 'light' | 'dark'): void {
    this.themeService.set(value);
  }

  setColor(value: ColorScheme): void {
    this.colorService.set(value);
  }

  onUserNameChange(name: string): void {
    this.store.setUserName(name);
  }

  exportJson(): void {
    const json = this.store.exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foco-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async restoreSeed(): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'warning',
      title: 'Restaurar dados de exemplo?',
      message: 'Isto substitui todos os dados pelos de exemplo. Continuar?',
      confirmLabel: 'Restaurar',
    });
    if (!ok) return;
    this.store.replaceAll(emptyAppData());
  }

  async clearAll(): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Apagar tudo?',
      message: 'Isto apaga todos os dados. Continuar?',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    this.store.clearAll();
  }
}