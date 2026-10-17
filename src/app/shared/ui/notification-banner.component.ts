import { Component, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppIconComponent } from './icon.component';
import { DataStore } from '../../core/data.store';
import { NotificationService } from '../../core/notification.service';
import { OnboardingService } from '../../core/onboarding.service';
import { notificationAppearance } from '../../core/notification.utils';
import { AppNotification } from '../../core/models';

@Component({
  selector: 'app-notification-banner',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    @if (banner()) {
      <div
        class="fixed top-6 z-50 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[440px] pointer-events-auto"
        role="alert"
        aria-live="polite"
      >
        <div
          class="rounded-2xl border border-surface-line bg-surface-card p-4 max-[453px]:p-3 shadow-float flex items-start gap-3 max-[453px]:gap-2"
        >
          <div
            class="shrink-0 grid h-10 w-10 place-items-center rounded-xl"
            [class]="toneBg()"
          >
            <app-icon [name]="icon()" [size]="18" [class]="toneColor()" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-[13px] max-[453px]:text-[12px] font-semibold text-ink leading-tight">{{ banner()!.title }}</h3>
              <button
                type="button"
                (click)="dismiss()"
                class="shrink-0 rounded p-1 text-ink-400 hover:text-ink hover:bg-surface-app transition-colors duration-150"
                aria-label="Fechar notificação"
              >
                <app-icon name="x" [size]="14" />
              </button>
            </div>
            <p class="mt-0.5 text-[12px] max-[453px]:text-[11px] text-ink-500 leading-relaxed">{{ banner()!.message }}</p>
            <div class="mt-2.5 max-[453px]:mt-2 flex items-center justify-between gap-2 max-[453px]:gap-1">
              <span class="text-[11px] max-[453px]:text-[10px] text-ink-400">{{ banner()!.createdAt | date:'HH:mm' }}</span>
              <a
                routerLink="/notificacoes"
                class="text-[12px] max-[453px]:text-[11px] font-semibold text-brand hover:text-brand-600 transition-colors duration-150"
                >Ver todas as notificações</a
              >
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class NotificationBannerComponent {
  private notifications = inject(NotificationService);
  private store = inject(DataStore);
  private onboarding = inject(OnboardingService);

  readonly banner = signal<AppNotification | null>(null);
  private shownIds = new Set<string>();
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly icon = computed(() => {
    const b = this.banner();
    if (!b) return 'info';
    return notificationAppearance(b.type).icon;
  });

  readonly toneBg = computed(() => {
    const b = this.banner();
    if (!b) return 'bg-brand-100';
    const toneClass = notificationAppearance(b.type).toneClass;
    const map: Record<string, string> = {
      'bg-success': 'bg-success-soft',
      'bg-warn': 'bg-warn-soft',
      'bg-danger': 'bg-danger-soft',
      'bg-brand': 'bg-brand-100',
    };
    return map[toneClass] ?? 'bg-brand-100';
  });

  readonly toneColor = computed(() => {
    const b = this.banner();
    if (!b) return 'text-brand-fg';
    const toneClass = notificationAppearance(b.type).toneClass;
    const map: Record<string, string> = {
      'bg-success': 'text-success',
      'bg-warn': 'text-warn',
      'bg-danger': 'text-danger',
      'bg-brand': 'text-brand-fg',
    };
    return map[toneClass] ?? 'text-brand-fg';
  });

  constructor() {
    effect(() => {
      // Only show notifications after onboarding is completed or dismissed
      if (this.onboarding.open()) {
        this.banner.set(null);
        return;
      }
      const prefs = this.store.data().settings.notifications;
      if (prefs?.inAppEnabled === false) {
        this.banner.set(null);
        return;
      }
      const items = this.notifications.items();
      if (this.dismissTimer) {
        clearTimeout(this.dismissTimer);
        this.dismissTimer = null;
      }
      const newItem = items
        .filter((n) => !n.read && !this.shownIds.has(n.id))
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];

      if (newItem) {
        this.shownIds.add(newItem.id);
        this.banner.set(newItem);
        this.dismissTimer = setTimeout(() => this.dismiss(), 8000);
      }
    });
  }

  dismiss(): void {
    this.banner.set(null);
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
