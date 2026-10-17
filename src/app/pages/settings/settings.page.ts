import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataStore } from '../../core/data.store';
import { emptyAppData } from '../../core/storage.repository';
import { ConfirmService } from '../../core/confirm.service';
import { ColorSchemeService, ColorScheme } from '../../core/color-scheme.service';
import { AuthService } from '../../core/auth/auth.service';
import { AuthError } from '../../core/auth/auth.models';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppThemeToggleComponent } from '../../shared/ui/theme-toggle.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { NotificationChannelPrefs, NotificationPreferences } from '../../core/api.models';
import { OnboardingService } from '../../core/onboarding.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, AppThemeToggleComponent, AppButtonComponent],
  template: `
    <div class="mt-4 w-full min-w-0 sm:mt-8 sm:max-w-[720px]">
      <h1 class="mb-5 text-[26px] font-extrabold text-ink sm:mb-6 sm:text-[28px]">Definições</h1>

      <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
        <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Perfil</h3>
        <label for="userName" class="mb-1.5 block text-[12px] font-semibold text-ink-700">O teu nome</label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <input id="userName" type="text" [ngModel]="userName()" (ngModelChange)="onUserNameInput($event)" name="userName"
            class="min-w-0 flex-1 rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="O teu nome" />
          <app-button
            icon="save"
            [label]="savingName() ? 'A guardar…' : 'Salvar'"
            [loading]="savingName()"
            [disabled]="!canSaveName()"
            buttonClass="shrink-0 justify-center"
            (click)="saveName()"
          ></app-button>
        </div>
        @if (nameError()) {
          <p class="mt-1.5 text-[11px] text-danger">{{ nameError() }}</p>
        }
        @if (nameDirty()) {
          <p class="mt-1.5 text-[11px] text-ink-400">Tens alterações por guardar.</p>
        }
      </div>

      <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
        <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Palavra-passe</h3>
        <div class="flex flex-col gap-3">
          <div>
            <label for="currentPassword" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Palavra-passe atual</label>
            <div class="relative">
              <input id="currentPassword" [type]="showCurrentPassword() ? 'text' : 'password'" [ngModel]="currentPassword()" (ngModelChange)="setCurrentPassword($event)" name="currentPassword" autocomplete="current-password"
                class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 pr-11 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="••••••••" />
              <app-button variant="ghost" size="sm" [icon]="showCurrentPassword() ? 'eye-off' : 'eye'" [label]="showCurrentPassword() ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'" [iconOnly]="true" buttonClass="absolute right-3 top-1/2 -translate-y-1/2" (click)="showCurrentPassword.set(!showCurrentPassword())"></app-button>
            </div>
          </div>
          <div>
            <label for="newPassword" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Nova palavra-passe</label>
            <div class="relative">
              <input id="newPassword" [type]="showNewPassword() ? 'text' : 'password'" [ngModel]="newPassword()" (ngModelChange)="setNewPassword($event)" name="newPassword" autocomplete="new-password"
                class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 pr-11 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="••••••••" />
              <app-button variant="ghost" size="sm" [icon]="showNewPassword() ? 'eye-off' : 'eye'" [label]="showNewPassword() ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'" [iconOnly]="true" buttonClass="absolute right-3 top-1/2 -translate-y-1/2" (click)="showNewPassword.set(!showNewPassword())"></app-button>
            </div>
          </div>
          <div>
            <label for="passwordConfirmation" class="mb-1.5 block text-[12px] font-semibold text-ink-700">Confirmar nova palavra-passe</label>
            <div class="relative">
              <input id="passwordConfirmation" [type]="showPasswordConfirmation() ? 'text' : 'password'" [ngModel]="passwordConfirmation()" (ngModelChange)="setPasswordConfirmation($event)" name="passwordConfirmation" autocomplete="new-password"
                class="w-full rounded-xl border border-surface-line bg-surface-card px-4 py-2.5 pr-11 text-[13px] text-ink placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand/30" placeholder="••••••••" />
              <app-button variant="ghost" size="sm" [icon]="showPasswordConfirmation() ? 'eye-off' : 'eye'" [label]="showPasswordConfirmation() ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'" [iconOnly]="true" buttonClass="absolute right-3 top-1/2 -translate-y-1/2" (click)="showPasswordConfirmation.set(!showPasswordConfirmation())"></app-button>
            </div>
          </div>
          @if (passwordValidation()) {
            <p class="text-[11px] text-danger">{{ passwordValidation() }}</p>
          }
          @if (passwordError()) {
            <p class="text-[11px] text-danger">{{ passwordError() }}</p>
          }
          <div class="flex justify-end">
            <app-button
              icon="pencil"
              [label]="savingPassword() ? 'A alterar…' : 'Alterar palavra-passe'"
              [loading]="savingPassword()"
              [disabled]="!canSavePassword()"
              (click)="savePassword()"
            ></app-button>
          </div>
          <p class="text-[11px] leading-relaxed text-ink-400">Ao alterares a palavra-passe, as outras sessões deste utilizador são terminadas.</p>
        </div>
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

  <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-4 sm:mb-6">
      <div class="min-w-0 flex-1">
        <h3 class="mb-1 text-[18px] font-extrabold text-ink sm:mb-2 sm:text-[20px]">Notificações</h3>
        <p class="text-[13px] leading-relaxed text-ink-500">Escolhe quais canais e tipos de notificação queres receber. Desativar um canal impede o envio para todos os tipos; desativar um tipo afeta apenas esse tipo.</p>
      </div>
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand/20 shadow-sm">
        <app-icon name="bell-ring" [size]="18" class="text-brand" />
      </div>
    </div>

    <div class="space-y-4 sm:space-y-6">
      <!-- Canais -->
      <div class="rounded-xl border border-surface-line bg-surface-card p-4 sm:p-5">
        <div class="flex items-center gap-2 mb-3 sm:mb-4">
          <div class="h-8 w-8 shrink-0 rounded-xl bg-surface-app border border-surface-line flex items-center justify-center">
            <app-icon name="bell-ring" [size]="16" class="text-ink-500" />
          </div>
          <label class="text-[13px] font-semibold text-ink-700 sm:text-[14px]">Canais</label>
        </div>
        <p class="mb-3 sm:mb-4 text-[12px] leading-relaxed text-ink-500">Escolhe por onde queres receber as notificações.</p>

        <div class="space-y-2 sm:space-y-3">
          <label class="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface-card p-3 sm:p-3.5 hover:border-brand/30 transition cursor-pointer select-none group">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-xl bg-brand-50 border border-brand/20 flex items-center justify-center">
                <app-icon name="bell-ring" [size]="14" sm:size="16" class="text-brand" />
              </div>
              <div class="min-w-0">
                <span class="block text-[12px] sm:text-[13px] font-semibold text-ink">E-mail</span>
                <span class="block text-[11px] sm:text-[12px] text-ink-500">Recebe notificações no teu endereço de e-mail.</span>
              </div>
            </div>
            <input type="checkbox" [ngModel]="emailEnabled()" (ngModelChange)="emailEnabled.set($event)"
              class="h-5 w-5 sm:h-6 sm:w-6 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
          </label>
          <label class="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface-card p-3 sm:p-3.5 hover:border-brand/30 transition cursor-pointer select-none group">
            <div class="flex items-center gap-2 sm:gap-3">
              <div class="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-xl bg-brand-50 border border-brand/20 flex items-center justify-center">
                <app-icon name="smartphone" [size]="14" sm:size="16" class="text-brand" />
              </div>
              <div class="min-w-0">
                <span class="block text-[12px] sm:text-[13px] font-semibold text-ink">Notificações na app</span>
                <span class="block text-[11px] sm:text-[12px] text-ink-500">Recebe notificações diretamente na aplicação.</span>
              </div>
            </div>
            <input type="checkbox" [ngModel]="inAppEnabled()" (ngModelChange)="inAppEnabled.set($event)"
              class="h-5 w-5 sm:h-6 sm:w-6 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
          </label>
        </div>
      </div>

      <!-- Tipos de notificação -->
      <div class="rounded-xl border border-surface-line bg-surface-card p-4 sm:p-5">
        <div class="flex items-center gap-2 mb-3 sm:mb-4">
          <div class="h-8 w-8 shrink-0 rounded-xl bg-surface-app border border-surface-line flex items-center justify-center">
            <app-icon name="settings" [size]="16" class="text-ink-500" />
          </div>
          <label class="text-[13px] font-semibold text-ink-700 sm:text-[14px]">Tipos de notificação</label>
        </div>
        <p class="mb-3 sm:mb-4 text-[12px] leading-relaxed text-ink-500">Personaliza o que queres receber em cada canal.</p>

        <!-- Colunas (desktop) -->
        <div class="grid grid-cols-[1fr_auto_auto] border-b border-surface-line hidden sm:block">
          <div class="px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-[12px] font-semibold text-ink-700"></div>
          <div class="px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-[12px] font-semibold text-ink-700 text-center">E-mail</div>
          <div class="px-3 sm:px-4 py-2 sm:py-3 text-[11px] sm:text-[12px] font-semibold text-ink-700 text-center">Na app</div>
        </div>

        @for (t of notificationTypes; track t.key) {
          <div class="border-b border-surface-line last:border-b-0 group">
            <!-- Mobile: cartão compacto com tudo em coluna -->
            <div class="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <div class="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-lg bg-surface-app border border-surface-line flex items-center justify-center flex-shrink-0">
                  <app-icon [name]="t.icon" [size]="12" sm:size="14" class="text-ink-500" />
                </div>
                <div class="min-w-0 flex-1">
                  <span class="block text-[12px] sm:text-[13px] font-semibold text-ink leading-tight">{{ t.label }}</span>
                  <span class="block text-[11px] sm:text-[12px] text-ink-500 leading-tight">{{ t.description }}</span>
                </div>
              </div>

              <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-center">
                <label class="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none" [class.opacity-50]="!emailEnabled()">
                  <input type="checkbox" [ngModel]="typeEmail(t.key)" (ngModelChange)="setTypePref(t.key, 'email', $event)"
                    [disabled]="!emailEnabled()"
                    class="h-4 w-4 sm:h-5 sm:w-5 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
                  <span class="text-[11px] sm:text-[12px] text-ink-600">E-mail</span>
                </label>
                <label class="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none" [class.opacity-50]="!inAppEnabled()">
                  <input type="checkbox" [ngModel]="typeInApp(t.key)" (ngModelChange)="setTypePref(t.key, 'inApp', $event)"
                    [disabled]="!inAppEnabled()"
                    class="h-4 w-4 sm:h-5 sm:w-5 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
                  <span class="text-[11px] sm:text-[12px] text-ink-600">Na app</span>
                </label>
              </div>
            </div>

            <!-- Desktop: linha de tabela com colunas alinhadas -->
            <div class="grid grid-cols-[1fr_auto_auto] px-3 sm:px-4 py-2.5 sm:py-3 hidden sm:block border-t border-surface-line sm:border-t-0 group">
              <div class="flex items-center gap-2 sm:gap-3 min-w-0">
                <div class="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-lg bg-surface-app border border-surface-line flex items-center justify-center flex-shrink-0">
                  <app-icon [name]="t.icon" [size]="12" sm:size="14" class="text-ink-500" />
                </div>
                <div class="min-w-0">
                  <span class="block text-[12px] sm:text-[13px] font-semibold text-ink leading-tight">{{ t.label }}</span>
                  <span class="block text-[11px] sm:text-[12px] text-ink-500 leading-tight">{{ t.description }}</span>
                </div>
              </div>
              <div class="flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3">
                <label class="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none" [class.opacity-50]="!emailEnabled()">
                  <input type="checkbox" [ngModel]="typeEmail(t.key)" (ngModelChange)="setTypePref(t.key, 'email', $event)"
                    [disabled]="!emailEnabled()"
                    class="h-4 w-4 sm:h-5 sm:w-5 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
                  <span class="text-[11px] sm:text-[12px] text-ink-600">E-mail</span>
                </label>
              </div>
              <div class="flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3">
                <label class="flex items-center gap-1 sm:gap-1.5 cursor-pointer select-none" [class.opacity-50]="!inAppEnabled()">
                  <input type="checkbox" [ngModel]="typeInApp(t.key)" (ngModelChange)="setTypePref(t.key, 'inApp', $event)"
                    [disabled]="!inAppEnabled()"
                    class="h-4 w-4 sm:h-5 sm:w-5 rounded border border-surface-line bg-surface-card text-brand focus:ring-2 focus:ring-brand/30 shrink-0" />
                  <span class="text-[11px] sm:text-[12px] text-ink-600">Na app</span>
                </label>
              </div>
            </div>
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Estados -->
    @if (savingNotifications()) {
      <div class="mt-3 sm:mt-4 flex items-center gap-2 rounded-xl bg-brand-50 p-3">
        <app-icon name="loader-circle" [size]="16" class="animate-spin text-brand-fg" />
        <span class="text-[12px] font-medium text-brand-fg">A guardar alterações…</span>
      </div>
    } @else if (notificationsError()) {
      <div class="mt-3 sm:mt-4 flex items-center gap-2 rounded-xl border border-danger/40 bg-danger-soft p-3">
        <app-icon name="triangle-alert" [size]="16" class="text-danger" />
        <span class="text-[12px] font-medium text-danger">{{ notificationsError() }}</span>
      </div>
    } @else if (notificationsDirty()) {
      <div class="mt-3 sm:mt-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-50 p-3">
        <app-icon name="pencil" [size]="16" class="text-brand-fg" />
        <span class="text-[12px] font-medium text-brand-fg">Tens alterações de notificações por guardar.</span>
      </div>
    }

    <div class="mt-4 sm:mt-6 flex w-full justify-end">
      <app-button
        icon="save"
        [label]="savingNotifications() ? 'A guardar…' : 'Guardar notificações'"
        [loading]="savingNotifications()"
        [disabled]="!canSaveNotifications()"
        buttonClass="w-full sm:w-auto justify-center"
        (click)="saveNotifications()"
      ></app-button>
    </div>
  </div>

  <div class="mb-4 rounded-card bg-surface-card p-4 shadow-card sm:mb-5 sm:p-5">
    <h3 class="mb-3 text-[16px] font-bold text-ink sm:mb-4">Ajuda</h3>
    <p class="mb-3 text-[13px] text-ink-500">Precisas de um guia rápido sobre as principais funcionalidades da app?</p>
    <app-button
      variant="secondary"
      size="sm"
      icon="info"
      label="Ver tutorial novamente"
      [iconOnlyBelow]="null"
      buttonClass="w-full justify-start"
      [disabled]="!canRestartTutorial()"
      (click)="restartTutorial()"
    ></app-button>
    @if (!canRestartTutorial()) {
      <p class="mt-1.5 text-[11px] text-ink-400">O tutorial será iniciado automaticamente na tua próxima visita se ainda não o concluíste.</p>
    }
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
  `,
})
export class SettingsPage implements OnInit {
  private store = inject(DataStore);
  private confirm = inject(ConfirmService);
  private colorService = inject(ColorSchemeService);
  private auth = inject(AuthService);
  private onboarding = inject(OnboardingService);
  colorScheme = this.colorService.scheme;
  userName = signal(this.store.data().settings.userName);
  useApi = this.store.useApi;
  nameError = signal('');
  savingName = signal(false);
  /** O nome só é sincronizado a partir da store enquanto o utilizador não escrever. */
  private nameTouched = false;
  private legacyKey = 'foco:data:v1';

  readonly hasLegacyBackup = signal(false);

  currentPassword = signal('');
  newPassword = signal('');
  passwordConfirmation = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showPasswordConfirmation = signal(false);
  passwordError = signal('');
  savingPassword = signal(false);

  colorOptions: { key: ColorScheme; label: string; cssColor: string }[] = [
    { key: 'purple', label: 'Roxo', cssColor: 'rgb(108 92 231)' },
    { key: 'blue', label: 'Azul', cssColor: 'rgb(37 99 235)' },
    { key: 'red', label: 'Vermelho', cssColor: 'rgb(220 38 38)' },
    { key: 'gray', label: 'Cinza', cssColor: 'rgb(75 85 99)' },
  ];

  readonly nameDirty = computed(() => this.userName().trim() !== this.store.data().settings.userName);

  readonly canSaveName = computed(() => {
    const name = this.userName().trim();
    return name.length >= 2 && this.nameDirty() && !this.savingName();
  });

  readonly canSavePassword = computed(() => {
    const current = this.currentPassword();
    const next = this.newPassword();
    const confirmation = this.passwordConfirmation();
    return current.length > 0 && next.length >= 8 && next === confirmation && next !== current && !this.savingPassword();
  });

  // ---------- Notificações ----------

  notificationTypes: { key: string; label: string; icon: string; description: string }[] = [
    { key: 'welcome', label: 'Boas-vindas', icon: 'info', description: 'Mensagens de boas-vindas e orientações.' },
    { key: 'task_completed', label: 'Tarefa concluída', icon: 'circle-check', description: 'Quando uma tarefa é concluída.' },
    { key: 'task_expired', label: 'Tarefa expirada', icon: 'alarm-clock-plus', description: 'Quando uma tarefa ultrapassa o prazo.' },
    { key: 'task_due_soon', label: 'Prazo próximo', icon: 'calendar-days', description: 'Lembretes de prazos que se aproximam.' },
    { key: 'timer_running_long', label: 'Timer a correr há muito', icon: 'timer', description: 'Quando um timer está a decorrer há muito tempo.' },
    { key: 'daily_digest', label: 'Digest diário', icon: 'file-text', description: 'Resumo das notificações do dia.' },
  ];

  emailEnabled = signal(true);
  inAppEnabled = signal(true);
  typePrefs = signal<Record<string, NotificationChannelPrefs>>({});
  notificationsError = signal('');
  savingNotifications = signal(false);
  private notificationsTouched = false;

  readonly notificationsDirty = computed(() => {
    const current = this.store.data().settings.notifications ?? {};
    return (
      this.emailEnabled() !== (current.emailEnabled ?? true) ||
      this.inAppEnabled() !== (current.inAppEnabled ?? true) ||
      JSON.stringify(this.typePrefs()) !== JSON.stringify(current.types ?? {})
    );
  });

  readonly canSaveNotifications = computed(() => this.notificationsDirty() && !this.savingNotifications());

  typeEmail(key: string): boolean {
    return this.typePrefs()[key]?.email ?? true;
  }

  typeInApp(key: string): boolean {
    return this.typePrefs()[key]?.inApp ?? true;
  }

  setTypePref(key: string, field: 'email' | 'inApp', value: boolean): void {
    const types = { ...this.typePrefs() };
    types[key] = { ...(types[key] ?? {}), [field]: value };
    this.typePrefs.set(types);
  }

  async saveNotifications(): Promise<void> {
    if (!this.canSaveNotifications()) return;
    this.notificationsError.set('');
    this.savingNotifications.set(true);
    try {
      const prefs: NotificationPreferences = {
        emailEnabled: this.emailEnabled(),
        inAppEnabled: this.inAppEnabled(),
        types: this.typePrefs(),
      };
      this.store.setNotifications(prefs);
      this.notificationsTouched = true;
      this.store.showFlash('success', 'Notificações atualizadas.');
    } catch {
      this.notificationsError.set('Não foi possível atualizar as notificações. Tenta novamente.');
    } finally {
      this.savingNotifications.set(false);
    }
  }

  /** Erros de validação visíveis ao utilizador enquanto escreve (não só no botão desativado). */
  readonly passwordValidation = computed(() => {
    const current = this.currentPassword();
    const next = this.newPassword();
    const confirmation = this.passwordConfirmation();
    if (!current && !next && !confirmation) return '';
    if (!current) return 'Indica a palavra-passe atual.';
    if (next.length < 8) return 'A nova palavra-passe precisa de pelo menos 8 caracteres.';
    if (next === current) return 'A nova palavra-passe tem de ser diferente da atual.';
    if (!confirmation) return 'Confirma a nova palavra-passe.';
    if (next !== confirmation) return 'As palavras-passe não coincidem.';
    return '';
  });

  constructor() {
    effect(() => {
      // Reflete mudanças externas (carregamento das definições do servidor).
      if (!this.nameTouched) {
        this.userName.set(this.store.data().settings.userName);
      }
    });
    effect(() => {
      if (!this.notificationsTouched) {
        const n = this.store.data().settings.notifications ?? {};
        this.emailEnabled.set(n.emailEnabled ?? true);
        this.inAppEnabled.set(n.inAppEnabled ?? true);
        this.typePrefs.set(n.types ?? {});
      }
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

  /** Guarda o nome explicitamente (botão Salvar): local sempre, API quando aplicável. */
  onUserNameInput(value: string): void {
    this.nameTouched = true;
    this.userName.set(value);
    if (this.nameError()) this.nameError.set('');
  }

  async saveName(): Promise<void> {
    if (!this.canSaveName()) return;
    const name = this.userName().trim();
    if (name.length < 2) {
      this.nameError.set('Dá um nome com pelo menos 2 caracteres.');
      return;
    }
    this.nameError.set('');
    this.savingName.set(true);
    try {
      if (this.useApi) {
        // O nome visível na topbar/saudação vem da conta.
        await this.auth.updateProfile({ name });
      }
      this.store.setUserName(name);
      this.store.showFlash('success', 'Nome atualizado.');
    } catch (error: unknown) {
      const message = error instanceof AuthError ? error.message : 'Não foi possível atualizar o nome. Tenta novamente.';
      this.nameError.set(message);
    } finally {
      this.savingName.set(false);
    }
  }

  setCurrentPassword(value: string): void {
    this.currentPassword.set(value);
    this.clearPasswordError();
  }

  setNewPassword(value: string): void {
    this.newPassword.set(value);
    this.clearPasswordError();
  }

  setPasswordConfirmation(value: string): void {
    this.passwordConfirmation.set(value);
    this.clearPasswordError();
  }

  private clearPasswordError(): void {
    if (this.passwordError()) this.passwordError.set('');
  }

  async savePassword(): Promise<void> {
    if (!this.canSavePassword()) return;
    this.passwordError.set('');
    this.savingPassword.set(true);
    try {
      await this.auth.changePassword(this.currentPassword(), this.newPassword(), this.passwordConfirmation());
      this.currentPassword.set('');
      this.newPassword.set('');
      this.passwordConfirmation.set('');
      this.store.showFlash('success', 'Palavra-passe alterada.');
    } catch (error: unknown) {
      const message = error instanceof AuthError ? error.message : 'Não foi possível alterar a palavra-passe. Tenta novamente.';
      this.passwordError.set(message);
    } finally {
      this.savingPassword.set(false);
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
      title: this.useApi ? 'Apagar dados locais?' : 'Apagar tudo?',
      message: this.useApi
        ? 'Isto apaga os dados guardados apenas neste dispositivo. Os projetos, categorias e tarefas no servidor não são afetados. Continuar?'
        : 'Isto apaga todos os dados. Continuar?',
      confirmLabel: 'Apagar',
    });
    if (!ok) return;
    this.store.clearAll();
  }

  readonly canRestartTutorial = this.onboarding.completed;

  restartTutorial(): void {
    this.onboarding.start();
  }
}
