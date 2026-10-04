import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { emptyAppData } from '../../core/storage.repository';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="flex h-9 items-center rounded-xl bg-surface-app p-1">
          <button type="button" (click)="setTheme('light')"
            [class]="theme() === 'light' ? 'rounded-lg bg-brand-100 px-3 py-1 text-[12px] font-semibold text-brand' : 'rounded-lg px-3 py-1 text-[12px] text-ink-500'">
            Claro
          </button>
          <button type="button" (click)="setTheme('dark')"
            [class]="theme() === 'dark' ? 'rounded-lg bg-brand-100 px-3 py-1 text-[12px] font-semibold text-brand' : 'rounded-lg px-3 py-1 text-[12px] text-ink-500'">
            Escuro
          </button>
        </div>
      </div>

      <div class="rounded-card bg-surface-card p-5 shadow-card">
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
  theme = this.themeService.theme;
  userName = signal(this.store.data().settings.userName);

  constructor() {
    effect(() => {
      this.userName.set(this.store.data().settings.userName);
    });
  }

  setTheme(value: 'light' | 'dark'): void {
    this.themeService.set(value);
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

  restoreSeed(): void {
    if (!confirm('Isto substitui todos os dados pelos de exemplo. Continuar?')) return;
    this.store.replaceAll(emptyAppData());
  }

  clearAll(): void {
    if (!confirm('Isto apaga todos os dados. Continuar?')) return;
    this.store.clearAll();
  }
}