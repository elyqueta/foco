import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../core/notification.service';
import { notificationAppearance, notificationTypeLabel } from '../../core/notification.utils';
import { dateGroupLabel } from '../../core/date.utils';
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

  /**
   * Notificações agrupadas por data (a API devolve as mais recentes primeiro):
   * Hoje, Ontem, Esta semana, Semana passada e, mais atrás, a data completa.
   */
  readonly groups = computed(() => {
    const groups: { label: string; items: AppNotification[]; unread: number }[] = [];
    for (const item of this.items()) {
      const label = dateGroupLabel(item.createdAt);
      const last = groups.at(-1);
      if (last && last.label === label) {
        last.items.push(item);
        if (!item.read) last.unread += 1;
      } else {
        groups.push({ label, items: [item], unread: item.read ? 0 : 1 });
      }
    }
    return groups;
  });

  /** O utilizador já interagiu com o acordeão (para não reabrir o grupo por omissão). */
  private readonly groupTouched = signal(false);
  private readonly openGroup = signal<string | null>(null);

  /** Etiqueta do grupo expandido: o escolhido ou o mais recente quando nada foi escolhido. */
  readonly expandedLabel = computed(() => {
    const groups = this.groups();
    if (groups.length === 0) return null;
    if (!this.groupTouched()) return groups[0].label;
    const open = this.openGroup();
    if (open && groups.some((g) => g.label === open)) return open;
    // O grupo aberto desapareceu (ex.: notificações removidas): mostra o mais recente.
    return open ? groups[0].label : null;
  });

  isOpen(label: string): boolean {
    return this.expandedLabel() === label;
  }

  /** Abre um grupo e fecha os outros; clicar no grupo aberto fecha-o. */
  toggleGroup(label: string): void {
    this.groupTouched.set(true);
    this.openGroup.set(this.expandedLabel() === label ? null : label);
  }

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
