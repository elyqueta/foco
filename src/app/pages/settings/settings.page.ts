import { Component, inject, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { emptyAppData } from '../../core/storage.repository';
import { ConfirmService } from '../../core/confirm.service';
import { ColorSchemeService, ColorScheme } from '../../core/color-scheme.service';
import { AuthService } from '../../core/auth/auth.service';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { AppButtonComponent } from '../../shared/ui/button.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppThemeToggleComponent, AppButtonComponent],
  template: `
    <div class="mt-4 w-full min-w-0 sm:mt-8 sm:max-w-[720px]">
      <h1 class="mb-5 text-[26px] font-extrabold text-ink sm:mb-6 sm:text-[28px]">Definições</h1>

      <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
        <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Perfil</h3>
        <label class="mb-1.5 block text-[12px] font-semibold text-ink-700">O teu nome</label>
        <input type="text" [(ngModel)]="userName" class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="O teu nome" (ngModelChange)="onUserNameChange($event)" />
        @if (nameError()) {
          <p class="mt-1.5 text-[11px] text-danger">{{ nameError() }}</p>
        }
      </div>

      <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
        <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Aparência</h3>
        <app-theme-toggle />

        <label class="mt-4 mb-1.5 block text-[12px] font-semibold text-ink-700">Cor principal</label>
        <div class="grid grid-cols-2 gap-2 min-[480px]:grid-cols-4 sm:gap-3" role="radiogroup" aria-label="Esquema de cores">
          @for (option of colorOptions; track option.key) {
            <button type="button" (click)="setColor(option.key)"
              role="radio" [attr.aria-checked]="colorScheme() === option.key" [attr.aria-label]="'Seleccionar esquema ' + option.label"
              [class]="'relative flex min-h-12 min-w-0 items-center gap-2 rounded-2xl border p-2 pr-7 text-left transition min-[480px]:min-h-24 min-[480px]:flex-col min-[480px]:justify-center min-[480px]:gap-2 min-[480px]:p-3 ' + (colorScheme() === option.key ? 'border-brand bg-brand-50' : 'border-surface-line bg-surface-app hover:border-brand/50')">
              <span class="h-7 w-7 shrink-0 rounded-full border border-black/5" [style]="'background: ' + option.cssColor"></span>
              <span class="min-w-0 whitespace-nowrap text-[11px] font-semibold text-ink sm:text-[12px]">{{ option.label }}</span>
              @if (colorScheme() === option.key) {
                <app-icon name="check" [size]="14" class="absolute right-2 top-1/2 -translate-y-1/2 text-brand-fg min-[480px]:right-3 min-[480px]:top-auto min-[480px]:bottom-2 min-[480px]:translate-y-0" />
              }
            </button>
          }
        </div>
      </div>

      <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
        <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Dados</h3>
        @if (hasLegacyBackup()) {
          <div class="mb-4 rounded-xl border border-warn/40 bg-warn-soft p-4">
            <p class="text-[12px] font-semibold text-warn">Encontrámos dados guardados localmente antes da sincronização com o servidor (projetos e categorias antigos).</p>
            <p class="mt-1 text-[11px] leading-relaxed text-ink-500">Esses projetos não são enviados automaticamente para o servidor. Exporta o backup para os recuperares e, se quiseres, importá-los de novo.</p>
            <app-button variant="secondary" size="sm" icon="download" label="Exportar backup antigo" [iconOnlyBelow]="null" buttonClass="mt-3" (click)="exportLegacyBackup()"></app-button>
          </div>
        }
        <div class="flex flex-col gap-3">
          <app-button variant="secondary" size="sm" icon="download" label="Exportar JSON" [iconOnlyBelow]="null" buttonClass="w-full justify-start" (click)="exportJson()"></app-button>
          @if (!useApi) {
            <app-button variant="secondary" size="sm" icon="rotate-ccw" label="Restaurar dados de exemplo" [iconOnlyBelow]="null" buttonClass="min-h-10 h-auto w-full justify-start whitespace-normal py-2 text-left" (click)="restoreSeed()"></app-button>
          }
          <app-button variant="danger" size="sm" icon="trash-2" [label]="useApi ? 'Apagar dados locais' : 'Apagar tudo'" [iconOnlyBelow]="null" buttonClass="w-full justify-start" (click)="clearAll()"></app-button>
          @if (useApi) {
            <p class="text-[11px] leading-relaxed text-ink-400">Projetos, categorias e tarefas estão sincronizados com o servidor. Apenas as preferências de aparência são guardadas neste dispositivo.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsPage implements OnInit {
  private store = inject(DataStore);
  private confirm = inject(ConfirmService);
  private colorService = inject(ColorSchemeService);
  private auth = inject(AuthService);
  colorScheme = this.colorService.scheme;
  userName = signal(this.store.data().settings.userName);
  useApi = this.store.useApi;
  nameError = signal('');
  private nameTimer: ReturnType<typeof setTimeout> | null = null;
  private legacyKey = 'foco:data:v1';

  readonly hasLegacyBackup = signal(false);

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

  ngOnInit(): void {
    if (this.useApi) {
      this.hasLegacyBackup.set(this.readLegacyBackup() !== null);
    }
  }

  private readLegacyBackup(): unknown {
    try {
      const raw = localStorage.getItem(this.legacyKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  exportLegacyBackup(): void {
    const legacy = this.readLegacyBackup();
    if (!legacy) return;
    this.download(JSON.stringify(legacy, null, 2), 'foco-backup-antigo.json');
  }

  setColor(value: ColorScheme): void {
    this.colorService.set(value);
  }

  onUserNameChange(name: string): void {
    const trimmed = name.trim();
    if (this.nameTimer) clearTimeout(this.nameTimer);
    if (trimmed.length === 0) {
      this.nameError.set('');
      return;
    }
    if (trimmed.length < 2) {
      this.nameError.set('Dá um nome com pelo menos 2 caracteres.');
      return;
    }
    this.nameError.set('');
    if (this.store.data().settings.userName === trimmed) return;
    this.store.setUserName(trimmed);
    if (this.useApi) {
      // O nome visível na topbar/saudação vem da conta: sincroniza com debounce.
      this.nameTimer = setTimeout(() => {
        void this.auth.updateProfile({ name: trimmed }).catch(() => {
          this.nameError.set('Não foi possível atualizar o nome no servidor.');
        });
      }, 600);
    }
  }

  exportJson(): void {
    this.download(this.store.exportJson(), 'foco-backup.json');
  }

  private download(json: string, filename: string): void {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
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