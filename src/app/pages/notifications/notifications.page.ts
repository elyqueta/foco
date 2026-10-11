import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { notificationAppearance, notificationTypeLabel } from '../../core/notification.utils';
import { AppNotification } from '../../core/models';
import { ConfirmService } from '../../core/confirm.service';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { SkeletonComponent } from '../../shared/ui/skeleton.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, AppIconComponent, AppButtonComponent, SkeletonComponent],
  templateUrl: './notifications.page.html',
})
export class NotificationsPage {
  readonly notifications = inject(NotificationService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);

  readonly items = this.notifications.items;
  readonly unreadCount = this.notifications.unreadCount;
  readonly loading = this.notifications.loading;
  readonly loadingMore = this.notifications.loadingMore;
  readonly hasMore = this.notifications.hasMore;
  readonly error = this.notifications.error;

  readonly appearance = notificationAppearance;
  readonly label = notificationTypeLabel;

  /** Erro visível apenas quando não há lista para mostrar. */
  readonly showError = computed(() => !!this.error() && this.items().length === 0);

  /** Abre o assunto da notificação (tarefa ou projeto) e marca como lida. */
  async open(item: AppNotification): Promise<void> {
    await this.notifications.markRead(item.id);
    if (item.taskId) {
      await this.router.navigate(['/tarefas', item.taskId]);
    } else if (item.projectId) {
      await this.router.navigate(['/projetos', item.projectId]);
    }
  }

  remove(id: string): void {
    void this.notifications.remove(id);
  }

  markAllRead(): void {
    void this.notifications.markAllRead();
  }

  async clearAll(): Promise<void> {
    const ok = await this.confirm.confirm({
      type: 'danger',
      title: 'Limpar notificações?',
      message: 'Isto vai apagar todas as notificações. Esta ação não pode ser desfeita.',
      confirmLabel: 'Limpar',
    });
    if (!ok) return;
    await this.notifications.clear();
  }

  loadMore(): void {
    void this.notifications.loadMore();
  }

  retry(): void {
    void this.notifications.refresh();
  }

  formatDate(value: string): string {
    const d = new Date(value);
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
  }
}
