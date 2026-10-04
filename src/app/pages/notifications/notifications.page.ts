import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationService } from '../../core/notification.service';
import { AppNotification } from '../../core/models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="mt-8 max-w-[720px]">
      <div class="flex items-center justify-between">
        <h1 class="text-[28px] font-extrabold text-ink">Notificações</h1>
        @if (unreadCount() > 0) {
          <button type="button" (click)="markAllRead()" class="text-[12px] font-semibold text-brand-fg hover:underline">Marcar tudo como lido</button>
        }
      </div>

      <div class="mt-6 flex flex-col gap-3">
        @for (item of sortedItems(); track item.id) {
          <div [class]="'rounded-2xl border p-4 transition ' + (item.read ? 'border-surface-line bg-surface-card' : 'border-brand/30 bg-brand-50 shadow-card')">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[13px] font-semibold text-ink">{{ item.title }}</p>
                <p class="mt-1 text-[12px] text-ink-500">{{ item.message }}</p>
                <p class="mt-2 text-[10px] text-ink-400">{{ formatDate(item.createdAt) }}</p>
              </div>
              <div class="shrink-0">
                @if (item.type === 'focus') {
                  <span class="grid h-8 w-8 place-items-center rounded-xl bg-brand text-white"><lucide-icon name="target" class="h-4 w-4" /></span>
                } @else if (item.type === 'success') {
                  <span class="grid h-8 w-8 place-items-center rounded-xl bg-success text-white"><lucide-icon name="check" class="h-4 w-4" /></span>
                } @else if (item.type === 'warning') {
                  <span class="grid h-8 w-8 place-items-center rounded-xl bg-warn text-white"><lucide-icon name="triangle-alert" class="h-4 w-4" /></span>
                } @else {
                  <span class="grid h-8 w-8 place-items-center rounded-xl bg-surface-app text-ink-500"><lucide-icon name="info" class="h-4 w-4" /></span>
                }
              </div>
            </div>
          </div>
        } @empty {
          <p class="text-[13px] text-ink-500">Sem notificações.</p>
        }
      </div>
    </div>
  `,
})
export class NotificationsPage {
  private readonly notifications = inject(NotificationService);

  readonly items = this.notifications.items;
  readonly unreadCount = computed(() => this.notifications.unreadCount());

  sortedItems(): AppNotification[] {
    return [...this.items()].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  formatDate(value: string): string {
    const d = new Date(value);
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  }
}
